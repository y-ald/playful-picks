import { Link } from 'react-router-dom';

interface NavbarLinksProps {
  className?: string;
}

export const NavbarLinks = ({ className = "" }: NavbarLinksProps) => {
  return (
    <div className={`flex items-center gap-8 ${className}`}>
      <Link to="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
      <Link to="/shop" className="text-gray-600 hover:text-primary transition-colors">Shop</Link>
      <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link>
      <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link>
    </div>
  );
};