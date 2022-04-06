import { NextApiHandler } from 'next';
import { SES } from 'aws-sdk';
import { z } from 'zod';
import fetch from 'node-fetch';

const ses = new SES({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_SES_REGION!,
});

const dto = z.object({
  form: z.object({
    email: z
      .string()
      .min(1, "Email field shouldn't be empty")
      .email('Invalid email format'),
    name: z.string().min(1, "Name field shouldn't be empty"),
    subject: z.string().min(1, "Subject field shouldn't be empty"),
    message: z.string().min(1, "Message field shouldn't be empty"),
  }),
  token: z.string(),
});

const handler: NextApiHandler = async (req, res) => {
  switch (req.method) {
    case 'POST':
      const response = dto.safeParse(req.body);

      if (!response.success) {
        res.status(422).json({ message: response.error.issues[0].message });
        return;
      }

      const { email, name, subject, message } = response.data.form;
      const { token } = response.data;

      const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
      });

      const captchaData: any = await captchaResponse.json();

      if (!captchaData.success) {
        res.status(422).json({ message: 'Invalid captcha code' });
        return;
      }

      const params = {
        Destination: {
          ToAddresses: [process.env.AWS_SES_SOURCE!],
        },
        Message: {
          Body: {
            Html: {
              Data: `
                  <h2>Message from ${name} - ${email}</h2>
                  <br />
                  <p>${message.split('\n').join('<br />')}</p>
                `,
            },
          },
          Subject: { Data: subject },
        },
        Source: process.env.AWS_SES_SOURCE!,
      };

      try {
        await ses.sendEmail(params).promise();
      } catch (err) {
        res.status(500).json({ message: (err as Error).message });
        return;
      }

      res.json({ message: 'Email has sent successfully!' });
      break;

    default:
      res.status(404).json({ message: 'Route not exists' });
      break;
  }
};

export default handler;
