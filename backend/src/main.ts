import { start as startHTTP } from "./app";
import { start as startTCP } from "./socket";
startHTTP();
startTCP();