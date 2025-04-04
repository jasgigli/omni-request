// ESM usage
import omnirequest from '../dist/index.js';
// You can also import the OmniRequest class if needed
// import { OmniRequest } from '../dist/index.js';

// Simple GET request
omnirequest.get('https://dummyjson.com/products')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Using async/await
async function fetchData() {
  try {
    const response = await omnirequest.get('https://dummyjson.com/products/1');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchData();
