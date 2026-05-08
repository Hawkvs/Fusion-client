import { host } from "./globalRoutes/index";

export const spacsHost = `${host}/spacs`;

export const showAwardRoute = `${spacsHost}/awards_catalog/`;
export const updateCatalogRoute = `${spacsHost}/awards_catalog/`;
export const getPreviousWinnersRoute = `${spacsHost}/get-winners/`;
export const inviteApplicationsRoute = `${spacsHost}/release`; // ReleaseCreateView
export const checkApplicationWindow = `${spacsHost}/check-application-window/`;
export const showDirectorGoldSubmitRoute = `${spacsHost}/directorgold_update/`;
export const submitSilverRoute = `${spacsHost}/directorsilver_update/`;
export const submitPdmRoute = `${spacsHost}/proficiencydm_update/`;

