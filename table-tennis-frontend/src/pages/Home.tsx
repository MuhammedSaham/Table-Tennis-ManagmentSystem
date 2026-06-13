import React from "react";
import Hero from "../components/Hero";
import ChampionsSpotlight from "../components/ChampionsSpotlight";
import FeaturedTournaments from "../components/FeaturedTournaments";

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <ChampionsSpotlight />
      <FeaturedTournaments />
    </>
  );
};

export default Home;
