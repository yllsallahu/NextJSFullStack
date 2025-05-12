interface Props {
    text: string;
    onClick: () => void;
    type?: "button" | "submit" | "reset";
  }
  
  const Button = (props: Props) => {
    const { text, onClick, type = "button" } = props;
  
    return (
      <button
        type={type}
        onClick={onClick}
        className="bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-600"
      >
        {text}
      </button>
    );
  };
  
  export default Button;
  