import React from "react";
import {
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemText
} from "@material-ui/core";

const ANALYTICS_KEY =
    "edututor_learning_analytics_v1";


class EducatorDashboard extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            lastUpdated: null
        };
    }


    componentDidMount() {
        this.loadAnalytics();

        // Refresh dashboard when local analytics change.
        this.refreshTimer = setInterval(
            this.loadAnalytics,
            3000
        );
    }


    componentWillUnmount() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }


    loadAnalytics = () => {

        try {

            const stored =
                localStorage.getItem(
                    ANALYTICS_KEY
                );


            if (!stored) {

                this.setState({
                    events: [],
                    lastUpdated: new Date()
                });

                return;
            }


            let events = [];


            try {

                events =
                    JSON.parse(stored);

            } catch (error) {

                console.error(
                    "Unable to parse EduTutor analytics:",
                    error
                );

                events = [];

            }


            if (!Array.isArray(events)) {
                events = [];
            }


            this.setState({
                events,
                lastUpdated: new Date()
            });

        } catch (error) {

            console.error(
                "Unable to load EduTutor analytics:",
                error
            );

        }

    };


    clearAnalytics = () => {

        const confirmed =
            window.confirm(
                "Clear all EduTutor analytics data?"
            );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(
            ANALYTICS_KEY
        );


        this.setState({
            events: [],
            lastUpdated: new Date()
        });

    };


    getEvents = (eventType) => {

        return this.state.events.filter(
            event =>
                event.eventType ===
                eventType
        );

    };


    getNumber = (value) => {

        if (
            typeof value ===
            "number" &&
            Number.isFinite(value)
        ) {
            return value;
        }


        const parsed =
            Number(value);


        return Number.isFinite(parsed)
            ? parsed
            : null;

    };


    getStatistics = () => {

        const events =
            this.state.events;


        const problemStarted =
            this.getEvents(
                "problem_started"
            );


        const problemCompleted =
            this.getEvents(
                "problem_completed"
            );


        const masteryEvents =
            this.getEvents(
                "mastery_updated"
            );


        const lessonEvents =
            this.getEvents(
                "lesson_started"
            );


        const hintEvents =
            this.getEvents(
                "hint_generated"
            );


        const attemptedProblems =
            new Set(
                problemStarted
                    .map(
                        event =>
                            event.problemId
                    )
                    .filter(Boolean)
            );


        const completedProblems =
            new Set(
                problemCompleted
                    .map(
                        event =>
                            event.problemId
                    )
                    .filter(Boolean)
            );


        const masteryValues =
            masteryEvents

                .map(
                    event =>
                        this.getNumber(
                            event.mastery
                        )
                )

                .filter(
                    value =>
                        value !== null
                );


        let averageMastery = 0;


        if (
            masteryValues.length >
            0
        ) {

            averageMastery =
                masteryValues.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                ) /
                masteryValues.length;

        }


        const latestMastery =
            masteryValues.length > 0
                ? masteryValues[
                    masteryValues.length - 1
                ]
                : 0;


        const attemptedCount =
            attemptedProblems.size;


        const completedCount =
            completedProblems.size;


        const completionRate =
            attemptedCount > 0

                ? (
                    completedCount /
                    attemptedCount
                ) * 100

                : 0;


        return {

            totalEvents:
                events.length,

            lessonsStarted:
                lessonEvents.length,

            attemptedCount,

            completedCount,

            completionRate,

            averageMastery,

            latestMastery,

            hintCount:
                hintEvents.length,

            masteryUpdates:
                masteryEvents.length

        };

    };


    formatPercentage = (
        value
    ) => {

        if (
            typeof value !==
            "number" ||
            !Number.isFinite(value)
        ) {

            return "0%";

        }


        return (
            value * 100
        ).toFixed(1) + "%";

    };


    formatDate = (
        timestamp
    ) => {

        if (!timestamp) {
            return "Unknown";
        }


        try {

            return new Date(
                timestamp
            ).toLocaleString();

        } catch (error) {

            return "Unknown";

        }

    };


    getRecentActivity = () => {

        return this.state.events
            .slice()
            .reverse()
            .slice(0, 10);

    };


    getEventDescription = (
        event
    ) => {

        switch (
            event.eventType
        ) {

            case "lesson_started":

                return (
                    "Learner started lesson " +
                    (
                        event.lessonName ||
                        event.lessonId ||
                        "Unknown"
                    )
                );


            case "problem_started":

                return (
                    "Problem started: " +
                    (
                        event.problemId ||
                        "Unknown"
                    )
                );


            case "problem_completed":

                return (
                    "Problem completed: " +
                    (
                        event.problemId ||
                        "Unknown"
                    )
                );


            case "mastery_updated":

                return (
                    "Mastery updated to " +
                    this.formatPercentage(
                        this.getNumber(
                            event.mastery
                        ) || 0
                    )
                );


            case "hint_generated":

                return (
                    "AI hint generated"
                );


            default:

                return (
                    event.eventType ||
                    "Interaction recorded"
                );

        }

    };


    getActivitySecondaryText = (
        event
    ) => {

        const timestamp =
            this.formatDate(
                event.timestamp
            );


        if (
            event.eventType ===
            "mastery_updated"
        ) {

            return (
                timestamp +
                " | Mastery: " +
                this.formatPercentage(
                    this.getNumber(
                        event.mastery
                    ) || 0
                )
            );

        }


        return timestamp;

    };


    renderMetricCard = (
        title,
        value,
        description
    ) => {

        return (

            <Grid
                item
                xs={12}
                sm={6}
                md={3}
            >

                <Card>

                    <CardContent>

                        <Typography
                            variant="subtitle2"
                            color="textSecondary"
                            gutterBottom
                        >

                            {title}

                        </Typography>


                        <Typography
                            variant="h4"
                            component="div"
                        >

                            {value}

                        </Typography>


                        <Typography
                            variant="body2"
                            color="textSecondary"
                        >

                            {description}

                        </Typography>

                    </CardContent>

                </Card>

            </Grid>

        );

    };


    render() {

        const statistics =
            this.getStatistics();


        const recentActivity =
            this.getRecentActivity();


        return (

            <div
                style={{
                    padding: 24,
                    backgroundColor: "#F6F6F6",
                    minHeight: "100vh"
                }}
            >

                <Paper
                    style={{
                        padding: 24,
                        marginBottom: 24
                    }}
                >

                    <Grid
                        container
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >

                        <Grid item>

                            <Typography
                                variant="h4"
                                component="h1"
                            >

                                Educator Dashboard

                            </Typography>


                            <Typography
                                variant="body1"
                                color="textSecondary"
                            >

                                EduTutor learning analytics
                                and learner progress

                            </Typography>

                        </Grid>


                        <Grid item>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={
                                    this.loadAnalytics
                                }
                            >

                                Refresh

                            </Button>


                            <Button
                                variant="outlined"
                                style={{
                                    marginLeft: 8
                                }}
                                onClick={
                                    this.clearAnalytics
                                }
                            >

                                Clear Data

                            </Button>

                        </Grid>

                    </Grid>

                </Paper>


                <Grid
                    container
                    spacing={2}
                >

                    {this.renderMetricCard(
                        "Lessons Started",
                        statistics.lessonsStarted,
                        "Learning sessions started"
                    )}


                    {this.renderMetricCard(
                        "Problems Attempted",
                        statistics.attemptedCount,
                        "Unique problems started"
                    )}


                    {this.renderMetricCard(
                        "Problems Completed",
                        statistics.completedCount,
                        "Unique problems completed"
                    )}


                    {this.renderMetricCard(
                        "Completion Rate",
                        statistics.completionRate.toFixed(
                            1
                        ) + "%",
                        "Completed / attempted"
                    )}

                </Grid>


                <Grid
                    container
                    spacing={2}
                    style={{
                        marginTop: 4
                    }}
                >

                    <Grid
                        item
                        xs={12}
                        md={6}
                    >

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                    gutterBottom
                                >

                                    Mastery Progress

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >

                                    Current learner mastery

                                </Typography>


                                <Typography
                                    variant="h3"
                                    style={{
                                        marginTop: 16
                                    }}
                                >

                                    {
                                        this.formatPercentage(
                                            statistics.latestMastery
                                        )
                                    }

                                </Typography>


                                <LinearProgress

                                    variant="determinate"

                                    value={
                                        Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                statistics.latestMastery *
                                                100
                                            )
                                        )
                                    }

                                    style={{
                                        marginTop: 16,
                                        height: 10,
                                        borderRadius: 5
                                    }}

                                />

                            </CardContent>

                        </Card>

                    </Grid>


                    <Grid
                        item
                        xs={12}
                        md={6}
                    >

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                    gutterBottom
                                >

                                    Average Mastery

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >

                                    Average across recorded
                                    mastery updates

                                </Typography>


                                <Typography
                                    variant="h3"
                                    style={{
                                        marginTop: 16
                                    }}
                                >

                                    {
                                        this.formatPercentage(
                                            statistics.averageMastery
                                        )
                                    }

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    style={{
                                        marginTop: 8
                                    }}
                                >

                                    {
                                        statistics.masteryUpdates
                                    }{" "}
                                    mastery updates recorded

                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>

                </Grid>


                <Grid
                    container
                    spacing={2}
                    style={{
                        marginTop: 4
                    }}
                >

                    <Grid
                        item
                        xs={12}
                        md={4}
                    >

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                >

                                    AI Hint Usage

                                </Typography>


                                <Typography
                                    variant="h3"
                                    style={{
                                        marginTop: 12
                                    }}
                                >

                                    {
                                        statistics.hintCount
                                    }

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >

                                    Recorded hint-generation
                                    events

                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>


                    <Grid
                        item
                        xs={12}
                        md={4}
                    >

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                >

                                    Total Events

                                </Typography>


                                <Typography
                                    variant="h3"
                                    style={{
                                        marginTop: 12
                                    }}
                                >

                                    {
                                        statistics.totalEvents
                                    }

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >

                                    Learner interactions
                                    recorded

                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>


                    <Grid
                        item
                        xs={12}
                        md={4}
                    >

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                >

                                    Latest Mastery

                                </Typography>


                                <Typography
                                    variant="h3"
                                    style={{
                                        marginTop: 12
                                    }}
                                >

                                    {
                                        this.formatPercentage(
                                            statistics.latestMastery
                                        )
                                    }

                                </Typography>


                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >

                                    Most recent mastery
                                    measurement

                                </Typography>

                            </CardContent>

                        </Card>

                    </Grid>

                </Grid>


                <Paper
                    style={{
                        marginTop: 24,
                        padding: 24
                    }}
                >

                    <Typography
                        variant="h5"
                        gutterBottom
                    >

                        Recent Learner Activity

                    </Typography>


                    <Divider
                        style={{
                            marginBottom: 8
                        }}
                    />


                    {
                        recentActivity.length ===
                        0

                            ?

                            <Typography
                                color="textSecondary"
                                style={{
                                    padding: 16
                                }}
                            >

                                No learner activity has
                                been recorded yet.

                            </Typography>

                            :

                            <List>

                                {
                                    recentActivity.map(
                                        (
                                            event,
                                            index
                                        ) => (

                                            <ListItem
                                                key={
                                                    event.timestamp +
                                                    "-" +
                                                    index
                                                }
                                            >

                                                <ListItemText

                                                    primary={
                                                        this.getEventDescription(
                                                            event
                                                        )
                                                    }

                                                    secondary={
                                                        this.getActivitySecondaryText(
                                                            event
                                                        )
                                                    }

                                                />

                                            </ListItem>

                                        )
                                    )
                                }

                            </List>

                    }

                </Paper>


                <Paper
                    style={{
                        marginTop: 24,
                        padding: 24
                    }}
                >

                    <Typography
                        variant="h6"
                        gutterBottom
                    >

                        Analytics Status

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                    >

                        Data source:{" "}
                        <strong>
                            {ANALYTICS_KEY}
                        </strong>

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{
                            marginTop: 8
                        }}
                    >

                        Last refreshed:{" "}

                        {
                            this.state.lastUpdated
                                ? this.state.lastUpdated.toLocaleString()
                                : "Not yet loaded"
                        }

                    </Typography>

                </Paper>

            </div>

        );

    }

}


export default EducatorDashboard;