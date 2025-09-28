// Test script to demonstrate natural sizing functionality
const { calculateNaturalComponentSize } = require('./src/lib/utils.ts');

// Test cases for different component types
const testCases = [
  {
    name: "Simple Button",
    code: `const SimpleButton = () => {
  return <button className="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>;
};`,
    type: "Button"
  },
  {
    name: "Form Component",
    code: `const ContactForm = () => {
  return (
    <form className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Name</label>
        <input type="text" className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input type="email" className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea className="w-full px-3 py-2 border rounded-md h-24"></textarea>
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">
        Send Message
      </button>
    </form>
  );
};`,
    type: "Form"
  },
  {
    name: "Dashboard Card",
    code: `const DashboardCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sales Overview</h3>
        <span className="text-green-500 text-sm">+12%</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Sales</span>
          <span className="font-medium">$45,231</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Orders</span>
          <span className="font-medium">1,234</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Customers</span>
          <span className="font-medium">892</span>
        </div>
      </div>
    </div>
  );
};`,
    type: "Card"
  },
  {
    name: "Navigation Menu",
    code: `const NavigationMenu = () => {
  return (
    <nav className="bg-gray-800 text-white p-4 w-full">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">MyApp</h1>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-gray-300">Home</a></li>
            <li><a href="#" className="hover:text-gray-300">About</a></li>
            <li><a href="#" className="hover:text-gray-300">Services</a></li>
            <li><a href="#" className="hover:text-gray-300">Contact</a></li>
          </ul>
        </div>
        <button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
          Sign In
        </button>
      </div>
    </nav>
  );
};`,
    type: "Navigation"
  },
  {
    name: "Simple Text Display",
    code: `const TextDisplay = () => {
  return (
    <div className="text-center">
      <p className="text-gray-600">Welcome to our application!</p>
    </div>
  );
};`,
    type: "Text"
  }
];

console.log("🧪 Testing Natural Component Sizing\n");

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name} (${testCase.type})`);
  console.log(`   Code preview: ${testCase.code.substring(0, 100)}...`);
  
  try {
    const size = calculateNaturalComponentSize(testCase.code, testCase.type);
    console.log(`   ✅ Calculated size: ${size.width}x${size.height}px`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log("");
});

console.log("🎯 Summary:");
console.log("- Button components should be compact (150x50px)");
console.log("- Form components should be wider (400x250px+)");
console.log("- Card components should be larger (500x350px+)");
console.log("- Navigation should be wide and short (600x80px)");
console.log("- Text components should be small (200x100px)");
