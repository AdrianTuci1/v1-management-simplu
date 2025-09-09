import { ToothCondition } from "./toothCondition";

export interface ToothSchema {
	ISO: number;
	condition: keyof typeof ToothCondition;
	notes: string[];
}