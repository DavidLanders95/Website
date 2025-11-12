import NextErrorComponent from 'next/error';

function MyError({ statusCode }) {
  return <NextErrorComponent statusCode={statusCode} />;
}

MyError.getInitialProps = async (ctx) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(ctx);
  return errorInitialProps;
};

export default MyError;
