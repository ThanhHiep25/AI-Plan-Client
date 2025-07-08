// import { useEffect, useState } from "react";


// const HistoryPlan: React.FC = () => {
//     const [plans, setPlans] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         const fetchPlans = async () => {
//             try {
//                 const response = await fetch('');
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch plans');
//                 }
//                 const data = await response.json();
//                 setPlans(data);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchPlans();
//     }, []);

//     if (loading) return <div>Loading...</div>;
//     if (error) return <div>Error: {error}</div>;

//     return (
//         <div className="p-4">
//             <h1 className="text-2xl font-bold mb-4">Lịch sử kế hoạch</h1>
//             <ul className="space-y-4">
//                 {plans.map((plan: any) => (
//                     <li key={plan.id} className="p-4 border rounded-lg shadow-sm">
//                         <h2 className="text-xl font-semibold">{plan.title}</h2>
//                         <p>{plan.description}</p>
//                         <span className="text-sm text-gray-500">{new Date(plan.createdAt).toLocaleDateString()}</span>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }
// export default HistoryPlan;