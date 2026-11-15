import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const [
            paymentVerifications,
            membershipRequests,
            matches,
            users,
            tournaments,
        ] = await Promise.all([
            // 1. Payment Verifications (Admin / Super Admin actions)
            prisma.registrationPaymentVerification.findMany({
                take: 100,
                orderBy: { updatedAt: 'desc' },
                include: {
                    registration: {
                        include: {
                            tournament: { select: { id: true, name: true } },
                            player: { select: { id: true, firstName: true, lastName: true, email: true } }
                        }
                    }
                }
            }),

            // 2. Club Membership Requests (Approvals & Rejections)
            prisma.clubMembershipRequest.findMany({
                take: 100,
                orderBy: { requestedAt: 'desc' },
                include: {
                    playerProfile: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, email: true } }
                        }
                    }
                }
            }),

            // 3. Match Officiating Logs (Referee actions & score recordings)
            prisma.match.findMany({
                where: {
                    status: { in: ['COMPLETED', 'ONGOING'] }
                },
                take: 100,
                orderBy: { updatedAt: 'desc' },
                include: {
                    referee: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } }
                        }
                    },
                    tournament: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                    player1: { select: { id: true, firstName: true, lastName: true } },
                    player2: { select: { id: true, firstName: true, lastName: true } },
                    team1: { select: { id: true, name: true } },
                    team2: { select: { id: true, name: true } },
                    games: { orderBy: { gameNumber: 'asc' } }
                }
            }),

            // 4. User Directory & Security Events (Registrations, rank assignments)
            prisma.user.findMany({
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: {
                    playerProfile: { select: { ranking: true, isClubMember: true } }
                }
            }),

            // 5. Tournament Management Events
            prisma.tournament.findMany({
                take: 50,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    venue: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        ]);

        const userMap = new Map<string, { name: string; email: string }>();
        users.forEach((u) => {
            userMap.set(u.id, {
                name: `${u.firstName} ${u.lastName || ''}`.trim(),
                email: u.email
            });
        });

        const events: any[] = [];

        // Normalize Payment Verification logs
        for (const pv of paymentVerifications) {
            const verifierInfo = pv.verifiedBy ? userMap.get(pv.verifiedBy) : null;
            const verifierName = verifierInfo?.name || 'Tournament Official';
            const playerName = pv.registration?.player
                ? `${pv.registration.player.firstName} ${pv.registration.player.lastName || ''}`.trim()
                : 'Player';
            const tourneyName = pv.registration?.tournament?.name || 'Tournament';

            events.push({
                id: `pv-${pv.id}`,
                category: 'PAYMENT',
                action: pv.status === 'APPROVED' ? 'PAYMENT_VERIFIED' : pv.status === 'REJECTED' ? 'PAYMENT_REJECTED' : 'PAYMENT_SUBMITTED',
                badgeColor: pv.status === 'APPROVED' ? 'emerald' : pv.status === 'REJECTED' ? 'rose' : 'cyan',
                actorName: verifierName,
                actorRole: 'ADMIN',
                actorEmail: verifierInfo?.email,
                target: `${playerName} · ${tourneyName}`,
                details: `Tournament registration fee verification ${pv.status.toLowerCase()}${pv.rejectionReason ? ` (${pv.rejectionReason})` : ''}`,
                timestamp: pv.updatedAt || pv.createdAt,
                status: pv.status
            });
        }

        // Normalize Club Membership logs
        for (const mr of membershipRequests) {
            const reviewerInfo = mr.reviewedBy ? userMap.get(mr.reviewedBy) : null;
            const reviewerName = reviewerInfo?.name || 'Super Admin';
            const applicantUser = mr.playerProfile?.user;
            const applicantName = applicantUser
                ? `${applicantUser.firstName} ${applicantUser.lastName || ''}`.trim()
                : 'Applicant';

            events.push({
                id: `mr-${mr.id}`,
                category: 'MEMBERSHIP',
                action: mr.status === 'APPROVED' ? 'MEMBERSHIP_APPROVED' : mr.status === 'REJECTED' ? 'MEMBERSHIP_REJECTED' : 'MEMBERSHIP_REQUESTED',
                badgeColor: mr.status === 'APPROVED' ? 'emerald' : mr.status === 'REJECTED' ? 'rose' : 'amber',
                actorName: mr.status === 'PENDING' ? applicantName : reviewerName,
                actorRole: mr.status === 'PENDING' ? 'PLAYER' : 'SUPER_ADMIN',
                actorEmail: mr.status === 'PENDING' ? applicantUser?.email : reviewerInfo?.email,
                target: applicantName,
                details: `Club membership request ${mr.status.toLowerCase()}${mr.rejectionReason ? ` (${mr.rejectionReason})` : ''}`,
                timestamp: mr.reviewedAt || mr.requestedAt,
                status: mr.status
            });
        }

        // Normalize Match Officiating logs
        for (const m of matches) {
            const refereeUser = m.referee?.user;
            const refereeName = refereeUser
                ? `${refereeUser.firstName} ${refereeUser.lastName || ''}`.trim()
                : 'Official Referee';
            const p1 = m.player1 ? `${m.player1.firstName} ${m.player1.lastName || ''}`.trim() : (m.team1?.name || 'TBD');
            const p2 = m.player2 ? `${m.player2.firstName} ${m.player2.lastName || ''}`.trim() : (m.team2?.name || 'TBD');
            const scoreSummary = m.games && m.games.length > 0
                ? m.games.map((g: any) => `${g.player1Score}-${g.player2Score}`).join(', ')
                : '';

            events.push({
                id: `match-${m.id}`,
                category: 'REFEREE',
                action: m.status === 'COMPLETED' ? 'MATCH_OFFICIATED' : 'MATCH_IN_PROGRESS',
                badgeColor: m.status === 'COMPLETED' ? 'emerald' : 'cyan',
                actorName: refereeName,
                actorRole: 'REFEREE',
                actorEmail: refereeUser?.email,
                target: `${p1} vs ${p2}`,
                details: `${m.tournament?.name || 'Championship'} · ${m.category?.name || 'Category'} (${m.status})${scoreSummary ? ` | Sets: ${scoreSummary}` : ''}`,
                timestamp: m.endTime || m.updatedAt || m.createdAt,
                status: m.status
            });
        }

        // Normalize User Directory & Ranking events
        for (const u of users) {
            const userName = `${u.firstName} ${u.lastName || ''}`.trim();
            const rank = u.playerProfile?.ranking;

            if (rank) {
                events.push({
                    id: `rank-${u.id}`,
                    category: 'USER',
                    action: 'CLUB_RANK_ASSIGNED',
                    badgeColor: 'cyan',
                    actorName: 'Club Administration',
                    actorRole: 'ADMIN',
                    target: `${userName} (${u.email})`,
                    details: `Assigned official Club Seeding Rank #${rank}`,
                    timestamp: u.createdAt,
                    status: 'ACTIVE'
                });
            }

            events.push({
                id: `user-${u.id}`,
                category: 'USER',
                action: 'USER_REGISTERED',
                badgeColor: u.role === 'SUPER_ADMIN' ? 'amber' : u.role === 'REFEREE' ? 'cyan' : 'emerald',
                actorName: userName,
                actorRole: u.role,
                actorEmail: u.email,
                target: `${userName} (${u.role})`,
                details: `Account registered in system as ${u.role}${u.playerProfile?.isClubMember ? ' (Club Member)' : ''}`,
                timestamp: u.createdAt,
                status: 'REGISTERED'
            });
        }

        // Normalize Tournament Management logs
        for (const t of tournaments) {
            events.push({
                id: `tourney-${t.id}`,
                category: 'TOURNAMENT',
                action: t.status === 'COMPLETED' ? 'TOURNAMENT_CONCLUDED' : 'TOURNAMENT_UPDATED',
                badgeColor: t.status === 'COMPLETED' ? 'emerald' : t.status === 'ONGOING' ? 'cyan' : 'amber',
                actorName: 'Tournament Director',
                actorRole: 'SUPER_ADMIN',
                target: t.name,
                details: `${t.name} at ${t.venue || 'Club Arena'} (${t.status})`,
                timestamp: t.updatedAt || t.createdAt,
                status: t.status
            });
        }

        // Sort all aggregated events strictly descending by timestamp
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Calculate summary metrics for Super Admin
        const metrics = {
            totalLogs: events.length,
            refereeDutyCount: matches.filter(m => m.status === 'COMPLETED').length,
            paymentsProcessed: paymentVerifications.length,
            membershipsProcessed: membershipRequests.length,
            registeredAccounts: users.length
        };

        return res.status(200).json({
            status: 'success',
            data: {
                metrics,
                events
            }
        });
    } catch (error: any) {
        console.error('Audit logs query error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve system audit logs'
        });
    }
};
