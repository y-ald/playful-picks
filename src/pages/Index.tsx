import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AgeCategories from '../components/AgeCategories';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <div className="py-16 bg-white">
        <AgeCategories />
      </div>
    </div>
  );
};

export default Index;