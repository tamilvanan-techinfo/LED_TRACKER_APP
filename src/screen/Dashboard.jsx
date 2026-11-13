
import { Box, Typography } from "@mui/material";
import WindowDetails from "../components/WindowDetails";
import WindowManager from "../components/WindowManager";
import WindowControl from "../components/WindowControl";
import ContentDisplyer from "../components/ContentDisplyer";
import ColorControlPanel from "../components/ColorControlPanel";
import ModbusConfig from "../components/ModbusConfig";

function Dashboard() {
  return (
    <Box
      sx={{
        height: "96vh",
        width: "100%",

        display: "grid",

        gridTemplateColumns: "8fr 3fr 4fr",

        gap: 2,

        p: 2,

        boxSizing: "border-box",
      }}
    >
      {/* COLUMN 1 - 3 WIDTH */}


      {/* COLUMN 2 - 9 WIDTH */}

      <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,

          p: 2,

          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",

          minWidth: 0,
        }}
      >
        <ContentDisplyer/>
        <ColorControlPanel/>
      </Box>

      {/* COLUMN 3 - 3 WIDTH */}

        <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,

          p:0.5,

          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",

          minWidth: 0,
        }}
      >
        <WindowManager/>
        <WindowControl />
        <WindowDetails />
      </Box>

      <Box
        sx={{
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 2,

          p: 2,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          minWidth: 0,
        }}
      >
        <ModbusConfig/>
        
      </Box>
      

    
    </Box>
  );
}

export default Dashboard;
