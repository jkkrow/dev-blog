import { NextApiHandler } from 'next';

const isEmail = (value: string) => {
  return value.match(/^\S+@\S+\.\S+$/);
};

const isEmpty = (form: { [key: string]: string }) => {
  let result = false;
  for (let key in form) {
    form[key].trim() === '' && (result = true);
  }

  return result;
};

const handler: NextApiHandler = async (req, res) => {
  switch (req.method) {
    case 'POST':
      const { email, name, subject, message } = req.body;

      if (!isEmail(email) || isEmpty(req.body)) {
        return res.status(422).json({ message: 'Invalid inputs' });
      }

      res.json({ message: 'Email has sent successfully!' });
      break;
    default:
      res.status(404).json({ message: 'Route not exists' });
      break;
  }
};

export default handler;
