import { useQuery } from 'react-query';
import categoriesAPI from '../api/categories';

// Fallback in case DB is empty or not yet seeded
const FALLBACK = [
  { name: 'Web Development',      icon: '💻' },
  { name: 'Mobile Development',   icon: '📱' },
  { name: 'Design & Creative',    icon: '🎨' },
  { name: 'Digital Marketing',    icon: '📣' },
  { name: 'Content & Writing',    icon: '✍️'  },
  { name: 'Data & Analytics',     icon: '📊' },
  { name: 'Finance & Accounting', icon: '💰' },
  { name: 'Legal & Compliance',   icon: '⚖️'  },
  { name: 'HR & Recruitment',     icon: '👥' },
  { name: 'Sales & Business Dev', icon: '📈' },
  { name: 'Project Management',   icon: '📋' },
  { name: 'IT & Networking',      icon: '🖧'  },
  { name: 'Engineering',          icon: '⚙️'  },
  { name: 'Operations',           icon: '🏭' },
  { name: 'Other',                icon: '📁' },
];

export const useCategories = () => {
  const { data, isLoading } = useQuery(
    'categories',
    () => categoriesAPI.getAll().then(r => r.data.categories),
    { staleTime: 1000 * 60 * 10 } // cache 10 minutes
  );

  const categories = (data && data.length > 0) ? data : FALLBACK;
  const names      = categories.map(c => c.name);

  return { categories, names, isLoading };
};
