const Auth = () => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      localStorage.setItem("name", e.target.value);
      window.location.href = "/home";
    }
  };

  return (
    <div>
      <input placeholder="name" onKeyDown={handleKeyDown}></input>
    </div>
  );
};

export default Auth;
