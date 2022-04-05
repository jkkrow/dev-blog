import Head from 'next/head';
import { Fragment } from 'react';

import ContactForm from 'components/Contact/Form';

const ContactPage = () => {
  return (
    <Fragment>
      <Head>
        <title>Contact</title>
        <meta name="description" content="Send email" />
      </Head>
      <ContactForm />
    </Fragment>
  );
};

export default ContactPage;
