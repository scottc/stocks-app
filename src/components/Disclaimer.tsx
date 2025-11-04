export const Disclaimer: React.FC<{}> = () => {
  return (
    <>
      <div
        style={{
          position: "fixed",
          zIndex: 999999999999999,
          display: "block",
          width: "100%",
          height: "40px",
          fontSize: "32px",
          fontWeight: "bold",
          textAlign: "center",
          background: "#f00",
          color: "#fff",
        }}
      >
        This is not financial advice! Always consult expert certified financial
        advice!
      </div>
      <div style={{ height: "40px" }}></div>
    </>
  );
};
