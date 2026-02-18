import * as linkcalendar from "./events/calendar/linkcalendar";
import * as synccalendar from "./events/calendar/synccalendar";
import * as events from "./events/events";

import * as completetask from "./gamification/task/completetask";
import * as createtask from "./gamification/task/createTaskModal";
import * as statustasks from "./gamification/task/statustasks";
import * as createleaderboard from "./gamification/createLeaderboard";
import * as donation from "./gamification/donation";
import * as rewards from "./gamification/rewards";
import * as score from "./gamification/score";

import * as join from "./user/join/join";
import * as getdata from "./user/getdata";
import * as leave from "./user/leave";
import * as syncroles from "./user/syncroles";
import * as syncusers from "./user/syncusers";

import * as help from "./other/help";
import * as intro from "./other/intro";
import * as ping from "./other/ping";

export const commands = {
    linkcalendar,
    synccalendar,
    events,

    completetask,
    createtask,
    statustasks,
    createleaderboard,
    donation,
    rewards,
    score,
    
    join,
    getdata,
    leave,
    syncroles,
    syncusers,

    help,
    intro,
    ping,
};
