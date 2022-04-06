export const sendContactData =
  (params: {
    form: {
      email: string;
      name: string;
      subject: string;
      message: string;
    };
    token: string;
  }) =>
  async () => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  };
