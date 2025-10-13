// services/video.service.js
import { getNextQueuedRow, getVideoRowById } from "../repositories/video.repository.js";

export const findNextQueuedVideo = () => getNextQueuedRow();
export const findVideoById       = (id) => getVideoRowById(id);
