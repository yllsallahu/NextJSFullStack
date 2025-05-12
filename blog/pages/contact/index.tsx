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

const ContactUs = ({ session }: Props) => {
    return (
        <div>
            <h1>Contact Us Page</h1>
            <p>Mirë se vini në aplikacionin tuaj Next.js!</p>
        </div>
    )
}

export default ContactUs
