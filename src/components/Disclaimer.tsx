export const Disclaimer: React.FC<{}> = () => {
  return (
    <>
      <div
        style={{
          position: "fixed",
          zIndex: 999999999999999,
          display: "block",
          width: "100%",
          height: "32px",
          fontSize: "32px",
          textAlign: "center",
          background: "#f00",
          color: "#fff",
        }}
      >
        This is not financial advice! Always consult expert certified financial
        advice!
      </div>
      <div style={{ height: "32px" }}></div>
    </>
  );
};
