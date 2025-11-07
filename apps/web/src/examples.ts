export const EXAMPLE_CODE = `import express from 'express';
import unused from 'lodash';

const app = express();

app.use(express.json());

app.get('/user/:id', async (req, res) => {
  const user = await getUserById(req.params.id);

  res.json({
    name: user.name,
    email: user.email
  });
});

app.post('/data', (req, res) => {
  const result = processData(req.body);
  result.then(data => {
    res.json(data);
  });
});

async function getUserById(id) {
  return {
    id,
    name: 'John Doe',
    email: null
  };
}

async function processData(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ processed: true, data });
    }, 100);
  });
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
`;
