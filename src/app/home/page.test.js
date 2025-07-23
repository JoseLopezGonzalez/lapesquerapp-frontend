const { render, screen } = require('@testing-library/react');
const HomePage = require('./page'); // Adjust the import based on your actual HomePage component

test('renders home page', () => {
	render(<HomePage />);
	const linkElement = screen.getByText(/home page/i);
	expect(linkElement).toBeInTheDocument();
});