import { Events } from "../interfaces/events.interface";

export interface Calendar  {
day: number | null;
currentDay: boolean;
currentMonth: boolean;
events: Events[];
date: Date;
}
