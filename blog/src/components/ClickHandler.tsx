function ClickHandler() {
    const handleClick = () => {
      alert("Butoni u klikua!");
    };
  
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Me Kliko
      </button>
    );
  }
  
  export default ClickHandler;

  