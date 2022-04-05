export const sendContactData =
  (formData: {
    email: string;
    name: string;
    subject: string;
    message: string;
  }) =>
  async () => {
    const { email, name, subject, message } = formData;

    const response = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ email, name, subject, message }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  };
