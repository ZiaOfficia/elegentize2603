import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | Elegantize Weddings</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white px-6">
        <div className="text-center max-w-md">
          <p className="text-6xl font-display font-bold text-primary mb-4">404</p>
          <h1 className="text-2xl font-display tracking-tight mb-4">Page Not Found</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-white text-xs uppercase tracking-widest font-bold py-3 px-8 hover:bg-primary-dark transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
