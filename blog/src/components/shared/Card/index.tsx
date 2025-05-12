import Image from "next/image";

interface Props {
  imageUrl: string;
  title: string;
  description: string;
}

const Card = (props: Props) => {
  const { imageUrl, title, description } = props;

  return (
    <div className="border shadow-md rounded-lg p-4">
      <Image
        src={imageUrl}
        alt={title}
        width={400}
        height={200}
        className="w-full h-40 object-cover rounded-t-lg"
      />
      <h2 className="text-xl font-bold mt-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Card;
