import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AgeCategories from '../components/AgeCategories';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <AgeCategories />
    </div>
  );
};

export default Index;