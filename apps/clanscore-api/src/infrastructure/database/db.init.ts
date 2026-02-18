import mongoose from "mongoose";
import { IRole, Role } from "../../domain/user/Role";
import { Person } from "../../domain/user/Person";
import { EventDetails } from "../../domain/event/EventDetails";
import { EventParticipant } from "../../domain/event/EventParticipant";
import { Task } from "../../domain/gamification/Task";
import { TaskParticipant } from "../../domain/gamification/TaskParticipant";
import { Leaderboard } from "../../domain/gamification/Leaderboard";
import { LeaderboardEntry } from "../../domain/gamification/LeaderboardEntry";
import { LeaderboardTransaction } from "../../domain/gamification/LeaderboardTransaction";
import { Transaction } from "../../domain/gamification/Transaction";
import { Reward } from "../../domain/gamification/Reward";
import { Donation } from "../../domain/gamification/Donation";
import { ErrorType, err, ErrorDetails, getErrorMessage } from "@clanscore/shared";
import { PermissionsBitField } from "discord.js";
import { UserRole } from "../../domain/user/UserRole";
import { TaskType } from "../../domain/gamification/TaskType";
import { AnnualPlan } from "../../domain/gamification/AnnualPlan";
import { GamificationParameter } from "../../domain/gamification/GamificationParameter";
import { MembershipFee } from "../../domain/user/MembershipFee";
import { Reminder } from "../../domain/user/Reminder";
import { Payment } from "../../domain/user/Payment";
import { config } from "../../config";

export const connectDB = async (): Promise<void> => {
    if (mongoose.connection.readyState === 1) {
        console.log("✅ Already connected to the database");
        return;
    }

    const host = config.MONGO_HOST;
    const port = config.MONGO_PORT;
    const dbName = config.MONGO_DB;
    const user = config.MONGO_INITDB_ROOT_USERNAME;
    const pass = config.MONGO_INITDB_ROOT_PASSWORD;

    const isLocalhost = host === 'localhost' || host === '127.0.0.1';

    let mongoUri = "";
    // const replicaURI = "mongodb://localhost:27017/?replicaSet=rs0";

    if (user && pass && !isLocalhost) {
        mongoUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}?authSource=admin`;
        console.log(`Connecting to docker/remote database at ${host}:${port}/${dbName} with authentication...`);
    } else {
        mongoUri = `mongodb://${host}:${port}/${dbName}`;
        console.log(`Connecting to local database at ${host}:${port}/${dbName} (no authentication)...`);
    }

    try {
        console.log(`Attempting to connect to MongoDB at ${host}:${port}/${dbName}...`);

        const connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 Sekunden Timeout
            socketTimeoutMS: 45000, // 45 Sekunden Socket Timeout
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("MongoDB connection timeout after 10 seconds"));
            }, 10000);
        });

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log("✅ Connected to the database");
        //await mongoose.connection.dropDatabase();
        //console.log("🧹 Database dropped successfully!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`❌ Failed to connect to database: ${error.message}`);
        console.error("Connection details:");
        console.error(`  - Host: ${host}`);
        console.error(`  - Port: ${port}`);
        console.error(`  - Database: ${dbName}`);
        console.error(`  - Username: ${user || 'Not set'}`);
        console.error(`  - Password: ${pass ? '***' : 'Not set'}`);
        console.error(`  - Full error: ${JSON.stringify(error, null, 2)}`);
        
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseConnectionError,
            details: { message: error.message },
        };
        getErrorMessage(errorDetails);
        throw err(ErrorType.DatabaseConnectionError, {
            message: error.message,
        });
    }
};

async function initializeRoles(): Promise<{
    vorstandRole: IRole;
    mitgliedRole: IRole;
} | null> {
    const rolesToCreate = [
        {
            name: "Vorstand",
            discordColor: "#FF0000",
            discordPosition: 1,
            discordPermissions: new PermissionsBitField([
                "ViewChannel",
                "ManageChannels",
                "CreateGuildExpressions",
                "ManageGuildExpressions",
                "ManageWebhooks",
                "CreateInstantInvite",
                "ChangeNickname",
                "ManageNicknames",
                "KickMembers",
                "BanMembers",
                "SendMessages",
                "EmbedLinks",
                "AttachFiles",
                "AddReactions",
                "UseExternalEmojis",
                "UseExternalStickers",
                "MentionEveryone",
                "ManageMessages",
                "ReadMessageHistory",
                "SendTTSMessages",
                "Connect",
                "Speak",
                "Stream",
                "UseSoundboard",
                "UseExternalSounds",
                "UseVAD",
                "MuteMembers",
                "DeafenMembers",
                "MoveMembers",
                "UseApplicationCommands",
                "UseEmbeddedActivities",
                "RequestToSpeak",
                "Administrator",
            ]).bitfield.toString(),
        },
        {
            name: "Mitglied",
            discordColor: "#00FF00",
            discordPosition: 2,
            discordPermissions: new PermissionsBitField([
                "ViewChannel",
                "CreateInstantInvite",
                "ChangeNickname",
                "SendMessages",
                "EmbedLinks",
                "AttachFiles",
                "AddReactions",
                "UseExternalEmojis",
                "UseExternalStickers",
                "ReadMessageHistory",
                "SendTTSMessages",
                "Connect",
                "Speak",
                "Stream",
                "UseSoundboard",
                "UseExternalSounds",
                "UseVAD",
                "UseApplicationCommands",
                "UseEmbeddedActivities",
                "RequestToSpeak",
            ]).bitfield.toString(),
        },
    ];

    const createdRoles: { [key: string]: IRole } = {};

    for (const roleData of rolesToCreate) {
        const existingRole = await Role.findOne({ name: roleData.name });
        if (!existingRole) {
            const newRole = await Role.create(roleData);
            createdRoles[roleData.name] = newRole;
        } else {
            createdRoles[roleData.name] = existingRole;
        }
    }

    return {
        vorstandRole: createdRoles["Vorstand"],
        mitgliedRole: createdRoles["Mitglied"],
    };
}

async function initializeData() {
    try {
        console.log("Initializing data...");

        await Person.createCollection().catch(() => {});
        await Role.createCollection().catch(() => {});
        await UserRole.createCollection().catch(() => {});
        await EventDetails.createCollection().catch(() => {});
        await EventParticipant.createCollection().catch(() => {});
        await Task.createCollection().catch(() => {});
        await TaskType.createCollection().catch(() => {});
        await TaskParticipant.createCollection().catch(() => {});
        await AnnualPlan.createCollection().catch(() => {});
        await Leaderboard.createCollection().catch(() => {});
        await LeaderboardEntry.createCollection().catch(() => {});
        await LeaderboardTransaction.createCollection().catch(() => {});
        await Transaction.createCollection().catch(() => {});
        await Reward.createCollection().catch(() => {});
        await Donation.createCollection().catch(() => {});
        await MembershipFee.createCollection().catch(() => {});
        await Reminder.createCollection().catch(() => {});
        await Payment.createCollection().catch(() => {});
        await GamificationParameter.createCollection().catch(() => {});

        await initializeRoles();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails: ErrorDetails = {
            type: ErrorType.DatabaseGenericError,
            details: {
                message: `Error initializing data: ${errorMessage}`,
            }
        };
        getErrorMessage(errorDetails);
    }
}

(async () => {
    await initializeData();
})();
