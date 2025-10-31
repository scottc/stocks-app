interface CardProps {}
const Card = (props: CardProps) => (
  <div
    {...props}
    style={{
      border: "5px solid black",
      margin: "10px",
      padding: "10px",
      background: "rgba(0,0,0,0.2)",
      overflowX: "auto",
    }}
  />
);

export { Card };
