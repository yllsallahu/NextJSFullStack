import Head from 'next/head'
import { getSession } from "next-auth/react";
import type { GetServerSidePropsContext } from "next";
import type { Session } from "next-auth";

interface Props {
  session: Session;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }
  return { props: { session } };
}

const About = ({ session }: Props) => (
    <>
        <Head>
            <title>About Us</title>
            <meta name="description" content="Mësoni më shumë rreth nesh." />
        </Head>
        <div>
            <h1>About Us</h1>
            <p>Kjo është faqja për rreth nesh.</p>
        </div>
    </>
)

export default About
