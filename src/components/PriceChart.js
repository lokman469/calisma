import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function PriceChart({ data }) {
  const chartData = data.map(item => ({
    name: item.symbol.toUpperCase(),
    price: item.current_price
  }));

  return (
    <LineChart width={800} height={400} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="price" stroke="#8884d8" />
    </LineChart>
  );
}

export default PriceChart; 