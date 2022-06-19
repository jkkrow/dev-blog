import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

import Input from 'components/Input';
import { useForm } from 'hooks/form';
import { useApi } from 'hooks/api';
import { VALIDATOR_EMAIL, VALIDATOR_REQUIRE } from 'lib/validators';
import classes from './index.module.scss';

const ContainerVariants = {
  hidden: { scale: 0 },
  enter: { scale: 1 },
  exit: { scale: 0 },
};

const formVariants = {
  collapsed: { height: 0 },
  visible: { height: 'auto' },
};

const COLLAPSE_DURATION = 1000;

const ContactForm: React.FC = () => {
  const { formState, setFormInput, setFormData } = useForm({
    email: { value: '', isValid: false },
    name: { value: '', isValid: false },
    subject: { value: '', isValid: false },
    message: { value: '', isValid: false },
  });

  const { status, error, api } = useApi();

  const [isValidated, setIsValidated] = useState(false);
  const [transitionFinished, setTransitionFinished] = useState(true);
  const [transitionSuspended, setTransitionSuspended] = useState(false);

  const finishedTimer = useRef<ReturnType<typeof setTimeout>>();
  const suspendedTiemr = useRef<ReturnType<typeof setTimeout>>();

  const hcaptchaRef = useRef<any>();

  const sendEmailHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsValidated(false);

    if (isSuccess) {
      setTransitionSuspended(false);
      return;
    }

    if (!formState.isValid) {
      setIsValidated(true);
      return;
    }

    setTransitionFinished(false);
    hcaptchaRef.current.execute();
  };

  const hCaptchaChangeHandler = async (token: string | null) => {
    if (!token) return;

    await api('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: {
          email: formState.inputs.email.value,
          name: formState.inputs.name.value,
          subject: formState.inputs.subject.value,
          message: formState.inputs.message.value,
        },
        token,
      }),
    });
  };

  const hCaptchaCloseHandler = () => {
    setTransitionFinished(true);
  };

  const hCaptchaErrorHandler = () => {
    console.log('error');
    setTransitionFinished(true);
  };

  useEffect(() => {
    if (status !== 'pending') return;

    setTransitionFinished(false);
    setTransitionSuspended(true);
    finishedTimer.current && clearTimeout(finishedTimer.current);
    finishedTimer.current = setTimeout(() => {
      setTransitionFinished(true);
    }, COLLAPSE_DURATION);
  }, [status]);

  useEffect(() => {
    if (status !== 'success') return;

    suspendedTiemr.current && clearTimeout(suspendedTiemr.current);
    suspendedTiemr.current = setTimeout(() => {
      setTransitionSuspended(false);
    }, COLLAPSE_DURATION * 5);

    setFormData({ email: '', name: '', subject: '', message: '' });
  }, [status, setFormData]);

  useEffect(() => {
    if (status !== 'error') return;

    setTransitionSuspended(false);
  }, [status]);

  useEffect(() => {
    return () => {
      finishedTimer.current && clearTimeout(finishedTimer.current);
      suspendedTiemr.current && clearTimeout(suspendedTiemr.current);
    };
  }, []);

  const isPending = useMemo(() => {
    return status === 'pending' || !transitionFinished;
  }, [status, transitionFinished]);

  const isSuccess = useMemo(() => {
    return status === 'success' && transitionSuspended;
  }, [status, transitionSuspended]);

  const buttonMessage = useMemo(() => {
    let message = 'Send Email';

    if (isSuccess) {
      message = 'Email has sent successfully!';
    }

    if (isPending) {
      message = 'Sending Email . . .';
    }

    return message;
  }, [isPending, isSuccess]);

  const buttonClasses = useMemo(
    () =>
      isSuccess && !isPending
        ? [classes.button, classes.success].join(' ')
        : classes.button,
    [isSuccess, isPending]
  );

  return (
    <motion.section
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={ContainerVariants}
      className={classes.contact}
    >
      <form className={classes.form} noValidate onSubmit={sendEmailHandler}>
        <motion.div
          animate={isPending || isSuccess ? 'collapsed' : 'visible'}
          variants={formVariants}
          className={classes.group}
        >
          <div className={classes.header}>
            <h1>Contact</h1>
            {error && !isPending && (
              <div className={classes.error}>{error}</div>
            )}
          </div>
          <Input
            id="email"
            type="email"
            validators={[VALIDATOR_EMAIL()]}
            isValidated={isValidated}
            isSubmitted={isSuccess}
            onForm={setFormInput}
          />
          <Input
            id="name"
            validators={[VALIDATOR_REQUIRE()]}
            isValidated={isValidated}
            isSubmitted={isSuccess}
            onForm={setFormInput}
          />
          <Input
            id="subject"
            validators={[VALIDATOR_REQUIRE()]}
            isValidated={isValidated}
            isSubmitted={isSuccess}
            onForm={setFormInput}
          />
          <Input
            id="message"
            textarea
            validators={[VALIDATOR_REQUIRE()]}
            isValidated={isValidated}
            isSubmitted={isSuccess}
            onForm={setFormInput}
          />
          <HCaptcha
            size="invisible"
            ref={hcaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={hCaptchaChangeHandler}
            onError={hCaptchaErrorHandler}
            onClose={hCaptchaCloseHandler}
          />
        </motion.div>
        <button className={buttonClasses} disabled={isPending}>
          {buttonMessage}
        </button>
      </form>
    </motion.section>
  );
};

export default ContactForm;
