// src/App.tsx
import { UserProvider } from "./context/userContext";
import BrowserNavigation from "./navigation/BrowserNavigation";

const App: React.FC = () => {
  return (
    <UserProvider>
      <BrowserNavigation />
    </UserProvider>
  );
};

export default App;
