import type { 
    CalendarDTO,
    ClaimTaskResponseDTO, 
    DiscordMemberInput,
    DiscordRoleInput,
    DonationCreateDTO, 
    DonationDTO, 
    EventDetailsCreateDTO, 
    EventDetailsDTO, 
    IEvent, 
    JoinDataTempInputDTO, 
    JoinTempStep1DTO, 
    LeaderboardEntryDTO, 
    LeaderboardRankingEntryDTO, 
    OpenTaskDTO, 
    PersonCreateDTO, 
    PersonDTO, 
    PersonDataDTO,
    PersonSummaryDTO, 
    Result, 
    RewardDTO, 
    RoleDTO, 
    SyncRolesResponseDTO,
    SyncUsersResponseDTO,
    TaskDTO, 
    TaskParticipantDTO, 
    TransactionCreateDTO, 
    TransactionDTO, 
    UserRoleDTO,
    TaskTypeDTO
} from "@clanscore/shared";
import { ErrorDetails, ErrorType, getErrorMessage } from "@clanscore/shared";
import { config } from "../config";

const BASE = config.CLANSCORE_API_URL!;
console.log("BASE_URL:", BASE);
const KEY  = config.CLANSCORE_API_KEY;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type AcceptApplicationResponse = {
    person: PersonDTO;
    assignedRole: string;
    messageTemplate?: string;
};

export class ApiClient {
    constructor(
        private base: string = BASE,
        private key: string | undefined = KEY,
    ) {}

    private async call<T>(
    path: string,
    method: HttpMethod,
    body?: unknown,
): Promise<Result<T, ErrorDetails>> {
    // Timeout nach 30 Sekunden
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(`${this.base}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(this.key ? { "x-api-key": this.key } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const text = await res.text();
        console.log("API RAW RESPONSE:", text);

        let json: any;
        try {
            json = JSON.parse(text);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            const errorDetails: ErrorDetails = {
                type: ErrorType.UnknownError,
                details: {
                    message: `JSON PARSE ERROR: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
            return {
                ok: false,
                error: { type: "UnknownError" as ErrorType }
            };
        }

        if (res.ok) {
            return { ok: true, value: json };
        }

        const error: ErrorDetails =
            json?.code
                ? {
                      type: json.code as ErrorType,
                      details: json.details ?? { message: json.message },
                  }
                : {
                      type: "UnknownError" as ErrorType,
                      details: { message: json?.message },
                  };

        return { ok: false, error };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                ok: false,
                error: {
                    type: ErrorType.UnknownError,
                    details: { message: "API request timeout after 30 seconds" }
                }
            };
        }
        return {
            ok: false,
            error: {
                type: ErrorType.UnknownError,
                details: { 
                    message: error instanceof Error ? error.message : String(error)
                }
            }
        };
    }
}

    // Ping

    getFirstUser() {
        return this.call<PersonDTO>(`/user/firstUser`, "GET");
    }

    // Join

    getJoinTempDataByDiscordId(discordId: string) {
        return this.call<JoinDataTempInputDTO[]>(
            `/user/application/temp/by-discord/${encodeURIComponent(discordId)}`,
            "GET"
        );
    }

    updateJoinTempData(discordId: string, step1Data: JoinTempStep1DTO) {
        return this.call<JoinDataTempInputDTO[]>(
            `/user/application/temp/by-discord/${encodeURIComponent(discordId)}`,
            "PATCH",
            { step1Data }
        );
    }

    deleteJoinTempData(discordId: string) {
        return this.call<{ ok: true }>(
            `/user/application/temp/by-discord/${encodeURIComponent(discordId)}`,
            "DELETE",
        );
    }

    acceptApplication(
        personId: string, 
        roleId: string, 
        reviewerId: string
    ) {
        return this.call<AcceptApplicationResponse>(
            `/user/${encodeURIComponent(personId)}/application/accept`,
            "POST",
            { roleId, reviewerId }
        );
    }

    denyApplication(
        personId: string, 
        reviewerId: string
    ) {
        return this.call<PersonDTO>(
            `/user/${encodeURIComponent(personId)}/application/deny`, 
            "POST", 
            { reviewerId }
        );
    }

    isApplicationPending(personId: string) {
        return this.call<{ pending: boolean }>(
            `/user/${encodeURIComponent(personId)}/application/is-pending`, 
            "GET"
        );
    }

    updatePersonApplicationMessageId(
        personId: string,
        applicationMessageId: string,
    ) {
        return this.call<PersonDTO>(
            `/user/${encodeURIComponent(personId)}/application-message`,
            "PATCH",
            { applicationMessageId },
        );
    }


    // User

    savePerson(person: PersonCreateDTO) {
        return this.call<PersonDTO>(`/user`, "PATCH", { person });
    }

    getPersonByDiscordId(discordId: string) {
        return this.call<PersonDTO>(
            `/user/by-discord/${encodeURIComponent(discordId)}`,
            "GET",
        );
    }

    getPersonDataByDiscordId(discordId: string) {
        return this.call<PersonDataDTO>(
            `/user/by-discord/${encodeURIComponent(discordId)}/data`,
            "GET",
        );
    }

    updatePersonStatusAndDeletionDate(
        personId: string, 
        status: string, 
        deletionDateIso: string | null
    ) {
        return this.call<PersonDTO>(
            `/user/${encodeURIComponent(personId)}/status-deletion`, 
            "PATCH", 
            { status, deletionDateIso }
        );
    }

    removePerson(personId: string) {
        return this.call<PersonDTO>(`/user/${encodeURIComponent(personId)}`, "DELETE");
    }

    // UserRoles

    addUserRole(personId: string, roleId: string) {
        return this.call<{ ok: true }>(
            `/user/${encodeURIComponent(personId)}/roles`,
            "POST",
            { roleId },
        );
    }
    
    getUserRolesByUserId(personId: string) {
        return this.call<UserRoleDTO[]>(
            `/user/${personId}/roles`,
            "GET",
        );
    }

    // Roles

    getRoleByName(name: string) {
        return this.call<RoleDTO>(
            `/roles/by-name/${encodeURIComponent(name)}`,
            "GET",
        );
    }

    updatePersonRoleAndStatus(
        personId: string, 
        roleId: string, 
        status: string
    ) {
        return this.call<PersonDTO>(
            `/user/${encodeURIComponent(personId)}/role-status`, 
            "PATCH", 
            { roleId, status }
        );
    }

    // Calendar

    generateCalendarLinkUrl(guildId: string) {
        return this.call<{ url: string }>(
            `/calendar/link-url?guildId=${encodeURIComponent(guildId)}`,
            "GET"
        );
    }

    syncCalendar(guildId: string, discordEvents?: Array<{ id: string; name: string; description?: string | null; scheduledStartAt?: string | null; scheduledEndAt?: string | null; entityMetadata?: { location?: string | null } | null }>) {
        return this.call<{ ok: true }>(
            `/calendar/sync`,
            "POST",
            { guildId, discordEvents }
        );
    }

    getProviderEvents(guildId: string, limit = 5) {
        return this.call<IEvent[]>(
            `/calendar/provider-events?guildId=${encodeURIComponent(guildId)}&limit=${limit}`,
            "GET"
        );
    }

    getCalendarInfo(guildId: string) {
        return this.call<CalendarDTO>(
            `/calendar/info/${encodeURIComponent(guildId)}`,
            "GET"
        );
    }

    saveEventOverviewMessageId(guildId: string, eventOverviewMessageId: string) {
        return this.call<{ ok: true }>(
            `/calendar/info/${encodeURIComponent(guildId)}/overview-message`,
            "PATCH",
            { eventOverviewMessageId }
        );
    }

    // getCalendarValidAccessToken(guildId: string, providerName: string) {
    //     return this.call<{ url: string }>(
    //         `/calendar/access-token/?guildId=${encodeURIComponent(guildId)}&provider=${providerName}`,
    //         "GET"
    //     );
    // }

    createCalendarFromDiscord(payload: {
        guildId: string;
        event: any;
    }) {
        return this.call<{ ok: true }>(`/calendar/from-discord/create`, "POST", payload);
    }

    updateCalendarFromDiscord(payload: {
        guildId: string;
        providerEventId?: string;
        event: any;
    }) {
        return this.call<{ ok: true }>(`/calendar/from-discord/update`, "PATCH", payload);
    }

    deleteCalendarFromDiscord(payload: {
        guildId: string;
        discordEventId: string;
    }) {
        return this.call<{ ok: true }>(`/calendar/from-discord/delete`, "DELETE", payload);
    }

    // Events

    getAllEventDetails() {
        return this.call<EventDetailsDTO[]>(`/events`, "GET");
    }

    getEventDetailById(eventId: string) {
        return this.call<EventDetailsDTO>(
            `/events/${encodeURIComponent(eventId)}`,
            "GET",
        );
    }
    
    getEventDetailsByDiscordEventId(discordId: string) {
        return this.call<EventDetailsDTO>(
            `/events/by-discord/${encodeURIComponent(discordId)}`,
            "GET",
        );
    }

    createEventDetails(event: EventDetailsCreateDTO) {
        return this.call<{ ok: true }>(
            `/events`,
            "POST",
            event
        );
    }

    updateEventDetails(event: EventDetailsCreateDTO) {
        return this.call<{ ok: true }>(
            `/events`,
            "PATCH",
            event
        );
    }

    getUpcomingEvents(limit = 5) {
        return this.call<EventDetailsDTO[]>(
            `/events/upcoming?limit=${limit}`,
            "GET",
        );
    }

    //-------------------

    

    getRolesByNames(names: string[]) {
        return this.call<RoleDTO[]>(
            `/roles/by-names`,
            "POST",
            { names },
        );
    }

    createLeaderboard(payload: {
        name: string;
        description: string;
        startDateIso: string | null;
        endDateIso: string;
        numberVisibleEntries: number;
        createdByPersonId: string;
    }) {
        return this.call<{ id: string }>(`/leaderboards`, "POST", payload);
    }

    getActiveLeaderboards() {
        return this.call<
            Array<{ id: string; name: string; numberVisibleEntries: number; startDate: string; endDate: string }>
        >(`/leaderboards/active`, "GET");
    }

    getLeaderboardRanking(leaderboardId: string, limit: number) {
        return this.call<LeaderboardRankingEntryDTO[]>(
            `/leaderboards/${encodeURIComponent(
                leaderboardId,
            )}/ranking?limit=${limit}`,
            "GET",
        );
    }

    getRewards() {
        return this.call<RewardDTO[]>("/rewards", "GET");
    }

    claimReward(rewardId: string, discordId: string) {
        return this.call<TransactionDTO>(
            `/rewards/${encodeURIComponent(rewardId)}/claim`,
            "POST",
            { discordId }
        );
    }

    acceptRewardClaim(transactionId: string) {
        return this.call<{ personDiscordId: string; rewardName: string }>(
            `/rewards/accept-claim`,
            "POST",
            { transactionId }
        );
    }

    denyRewardClaim(transactionId: string) {
        return this.call<{ personDiscordId: string; rewardName: string }>(
            `/rewards/deny-claim`,
            "POST",
            { transactionId }
        );
    }

    claimTask(taskId: string, discordId: string) {
        return this.call<ClaimTaskResponseDTO>(
            `/tasks/${encodeURIComponent(taskId)}/claim`,
            "POST",
            { discordId }
        );
    }

    getOpenTasksForDiscordUser(discordId: string) {
        return this.call<OpenTaskDTO[]>(
            `/tasks/open/${encodeURIComponent(discordId)}`,
            "GET",
        );
    }

    createTask(payload: {
        name: string;
        description: string;
        points: number;
        maxParticipants: number;
        deadlineIso: string | null;
        createdByDiscordId: string;
        taskTypeId?: string | null;
    }) {
        return this.call<{ id: string }>(`/tasks`, "POST", payload);
    }

    getPersonsByRoleName(roleName: string) {
        return this.call<PersonSummaryDTO[]>(
            `/user/by-role/${encodeURIComponent(roleName)}`,
            "GET",
        );
    }

    getAllTaskTypes() {
        return this.call<TaskTypeDTO[]>(
            `/tasks/tasktypes`,
            "GET",
        );
    }

    getTaskParticipant(taskParticipantId: string) {
        return this.call<TaskParticipantDTO>(
            `/tasks/participants/${encodeURIComponent(taskParticipantId)}`,
            "GET",
        );
    }

    completeTask(taskId: string, discordId: string) {
        return this.call<{
            task: TaskDTO;
            person: PersonDTO;
            participant: TaskParticipantDTO;
            responsibleMention?: string;
        }>(
            `/tasks/${encodeURIComponent(taskId)}/complete`,
            "POST",
            { discordId }
        );
    }

    getPersonById(personId: string) {
        return this.call<PersonDTO>(`/user/${encodeURIComponent(personId)}`, "GET");
    }

    getTaskById(taskId: string) {
        return this.call<TaskDTO>(`/tasks/${encodeURIComponent(taskId)}`, "GET");
    }

    getExpiredTasks() {
        return this.call<TaskDTO[]>(`/tasks/expired`, "GET");
    }

    getOpenTasks() {
        return this.call<TaskDTO[]>(`/tasks/open`, "GET");
    }

    getDoneTasks() {
        return this.call<TaskDTO[]>(`/tasks/done`, "GET");
    }

    getAllTasks() {
        return this.call<TaskDTO[]>(`/tasks/`, "GET");
    }

    getTaskParticipants(taskId: string) {
        return this.call<PersonDTO[]>(`/tasks/${encodeURIComponent(taskId)}/participants`, "GET");
    }

    getTaskParticipantRecords(taskId: string) {
        return this.call<TaskParticipantDTO[]>(`/tasks/${encodeURIComponent(taskId)}/participant-records`, "GET");
    }

    setTaskCompleted(taskId: string, completed: boolean) {
        return this.call<TaskDTO>(
            `/tasks/${encodeURIComponent(taskId)}/completed`,
            "POST",
            { completed },
        );
    }

    setTaskResponsible(taskId: string, responsibleUserId: string) {
        return this.call<{ ok: true }>(
            `/tasks/${encodeURIComponent(taskId)}/responsible`,
            "POST",
            { responsibleUserId }
        );
    }

    setTaskDetails(taskId: string, providerEventDetailsId: string) {
        return this.call<{ ok: true }>(
            `/tasks/${encodeURIComponent(taskId)}/details`,
            "POST",
            { providerEventDetailsId }
        );
    }

    rewardTaskParticipant(taskId: string, personId: string) {
        return this.call<{ ok: true; maxReached: boolean }>(
            `/tasks/${encodeURIComponent(taskId)}/reward`,
            "POST",
            { personId },
        );
    }

    resetTaskParticipantCompleted(taskParticipantId: string) {
        return this.call<{ ok: true }>(
            `/tasks/participants/${encodeURIComponent(taskParticipantId)}/reset-completed`,
            "POST",
        );
    }

    getRoleById(id: string) {
        return this.call<RoleDTO>(`/roles/${id}`, "GET");
    }

    getAllRoles() {
        return this.call<RoleDTO[]>(`/roles`, "GET");
    }

    saveRole(role: Partial<RoleDTO>) {
        return this.call<RoleDTO>(`/roles`, "POST", role);
    }

    updateRole(roleId: string, role: Partial<RoleDTO>) {
        return this.call<RoleDTO>(`/roles/${roleId}`, "PATCH", role);
    }

    syncRoles(discordRoles: DiscordRoleInput[]) {
        return this.call<SyncRolesResponseDTO>(`/roles/sync`, "POST", { discordRoles });
    }

    getUserRolesByRoleId(roleId: string) {
        return this.call<UserRoleDTO[]>(
            `/roles/${roleId}/user-roles`,
            "GET",
        );
    }

    addUserRoleIfNotExists(personId: string, roleId: string) {
        return this.call<{ ok: true }>(
            `/user/${personId}/roles-if-not-exists`,
            "POST",
            { roleId },
        );
    }

    removeUserRoleById(userRoleId: string) {
        return this.call<{ ok: true }>(
            `/user-roles/${userRoleId}`,
            "DELETE",
        );
    }

    getPerson(personId: string) {
        return this.call<PersonDTO>(`/user/${personId}`, "GET");
    }

    getAllPersons() {
        return this.call<PersonDTO[]>(`/user`, "GET");
    }

    findOrCreatePersonByDiscordId(discordId: string, username: string) {
        return this.call<PersonDTO>(
            `/user/find-or-create-by-discord`,
            "POST",
            { discordId, username },
        );
    }

    syncUsers(discordMembers: DiscordMemberInput[]) {
        return this.call<SyncUsersResponseDTO>(`/user/sync`, "POST", { discordMembers });
    }

    // Spenden
    saveDonation(donation: DonationCreateDTO) {
        return this.call<DonationDTO>(`/donations`, "POST", donation);
    }

    updateDonationDonor(donationId: string, donatorPersonId: string) {
        return this.call<DonationDTO>(
            `/donations/${donationId}/donor`,
            "PATCH",
            { donatorPersonId },
        );
    }

    getDonationsByPersonId(personId: string) {
        return this.call<DonationDTO[]>(
            `/donations/by-person/${personId}`,
            "GET",
        );
    }

    // Transaktionen
    saveTransaction(tx: TransactionCreateDTO) {
        return this.call<TransactionDTO>(`/transactions`, "POST", tx);
    }

    getTransactionByDonationId(donationId: string) {
        return this.call<TransactionDTO>(
            `/transactions/by-donation/${donationId}`,
            "GET",
        );
    }

    getTransactionsByPersonId(personId: string) {
        return this.call<TransactionDTO[]>(
            `/transactions/by-person/${personId}`,
            "GET",
        );
    }

    // Punkte
    incrementPersonPoints(personId: string, amount: number) {
        return this.call<{ ok: true }>(
            `/user/${personId}/points/increment`,
            "POST",
            { amount },
        );
    }

    decrementPersonPoints(personId: string, amount: number) {
        return this.call<{ ok: true }>(
            `/user/${personId}/points/decrement`,
            "POST",
            { amount },
        );
    }

    getRewardsByPersonId(personId: string) {
        return this.call<RewardDTO[]>(
            `/rewards/by-person/${personId}`,
            "GET",
        );
    }

    getTaskParticipantsByPerson(personId: string) {
        return this.call<TaskParticipantDTO[]>(
            `/tasks/participants/by-person/${personId}`,
            "GET",
        );
    }

    getLeaderboardEntriesByPersonId(personId: string) {
        return this.call<LeaderboardEntryDTO[]>(
            `/leaderboards/entries/by-person/${personId}`,
            "GET",
        );
    }

    incrementActiveLeaderboardEntriesPoints(transaction: TransactionDTO) {
        return this.call<{ ok: true }>(
            `/leaderboards/entries/active/increment`,
            "POST",
            { transaction },
        );
    }

}

export const api = new ApiClient();
