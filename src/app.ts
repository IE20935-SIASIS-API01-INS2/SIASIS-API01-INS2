import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/router";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);


//Ruta de 404 NOT FOUND
app.use("*", (req, res) => {
  res.status(404).json({
    message: `La ruta ${req.originalUrl} no existe en este servidor - 404`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
