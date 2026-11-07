import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AdminDashboard from './AdminDashboard';
import ClientDashboard from './ClientDashboard';
import FreelancerDashboard from './FreelancerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'freelancer':
        return <FreelancerDashboard />;
      case 'client':
      default:
        return <ClientDashboard />;
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
