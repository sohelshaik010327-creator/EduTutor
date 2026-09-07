import React from "react";
import {
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@material-ui/core";


const ANALYTICS_KEY =
    "edututor_learning_analytics_v1";

const BASELINE_KEY =
    "edututor_baseline_evaluation_v1";


class EvaluationPanel extends React.Component {

    constructor(props) {

        super(props);

        this.state = {

            events: [],

            baseline: {

                attempted:
                    "",

                completed:
                    "",

                masteryBefore:
                    "",

                masteryAfter:
                    "",

                hints:
                    "",

                responseTime:
                    ""

            },

            lastUpdated:
                null

        };

    }


    componentDidMount() {

        this.loadData();

    }


    loadData = () => {

        let events = [];

        let baseline = {

            attempted: "",
            completed: "",
            masteryBefore: "",
            masteryAfter: "",
            hints: "",
            responseTime: ""

        };


        try {

            const storedAnalytics =
                localStorage.getItem(
                    ANALYTICS_KEY
                );


            if (storedAnalytics) {

                const parsed =
                    JSON.parse(
                        storedAnalytics
                    );


                if (
                    Array.isArray(parsed)
                ) {

                    events =
                        parsed;

                }

            }

        } catch (error) {

            console.error(
                "Unable to read EduTutor analytics:",
                error
            );

        }


        try {

            const storedBaseline =
                localStorage.getItem(
                    BASELINE_KEY
                );


            if (storedBaseline) {

                const parsed =
                    JSON.parse(
                        storedBaseline
                    );


                if (
                    parsed &&
                    typeof parsed ===
                    "object"
                ) {

                    baseline = {

                        ...baseline,

                        ...parsed

                    };

                }

            }

        } catch (error) {

            console.error(
                "Unable to read baseline evaluation:",
                error
            );

        }


        this.setState({

            events,

            baseline,

            lastUpdated:
                new Date()

        });

    };


    getEvents = (
        eventType
    ) => {

        return this.state.events.filter(
            event =>
                event.eventType ===
                eventType
        );

    };


    numberOrNull = (
        value
    ) => {

        if (
            value ===
            null ||
            value ===
            undefined ||
            value ===
            ""
        ) {

            return null;

        }


        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : null;

    };


    percentage = (
        numerator,
        denominator
    ) => {

        if (
            denominator ===
            0 ||
            denominator ===
            null ||
            denominator ===
            undefined
        ) {

            return null;

        }


        return (
            numerator /
            denominator
        ) * 100;

    };


    getEduTutorMetrics = () => {

        const started =
            this.getEvents(
                "problem_started"
            );


        const completed =
            this.getEvents(
                "problem_completed"
            );


        const mastery =
            this.getEvents(
                "mastery_updated"
            );


        const hints =
            this.getEvents(
                "hint_generated"
            );
        
            const answers =
            this.getEvents(
                "answer_submitted"
            );
        
        const answeredCount =
            answers.length;
        
        const correctAnswers =
            answers.filter(
                event =>
                    event.isCorrect === true
            ).length;
        
        const accuracy =
            this.percentage(
                correctAnswers,
                answeredCount
            );


        const uniqueStarted =
            new Set(

                started

                    .map(
                        event =>
                            event.problemId
                    )

                    .filter(Boolean)

            );



        const uniqueCompleted =
            new Set(

                completed

                    .map(
                        event =>
                            event.problemId
                    )

                    .filter(Boolean)

            );


        const masteryValues =
            mastery

                .map(
                    event =>
                        this.numberOrNull(
                            event.mastery
                        )
                )

                .filter(
                    value =>
                        value !== null
                );


        let masteryBefore =
            null;


        let masteryAfter =
            null;


        let masteryImprovement =
            null;


        if (
            masteryValues.length >=
            2
        ) {

            masteryBefore =
                masteryValues[0];


            masteryAfter =
                masteryValues[
                    masteryValues.length - 1
                ];


            masteryImprovement =
                (
                    masteryAfter -
                    masteryBefore
                ) * 100;

        }


        const completionRate =
            this.percentage(

                uniqueCompleted.size,

                uniqueStarted.size

            );


        const responseTimes =
            this.calculateResponseTimes();


        let averageResponseTime =
            null;


        if (
            responseTimes.length >
            0
        ) {

            averageResponseTime =
                responseTimes.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,

                    0

                ) /
                responseTimes.length;

        }


        return {

            attempted:
                uniqueStarted.size,
        
            completed:
                uniqueCompleted.size,
        
            completionRate,
        
            accuracy,
        
            correctAnswers,
        
            answeredCount,
        
            masteryBefore,
        
            masteryAfter,
        
            masteryImprovement,
        
            hints:
                hints.length,
        
            averageResponseTime
        
        };

    };


    calculateResponseTimes = () => {

        const started =
            this.getEvents(
                "problem_started"
            );


        const completed =
            this.getEvents(
                "problem_completed"
            );


        const times = [];


        completed.forEach(
            completedEvent => {

                if (
                    !completedEvent.problemId ||
                    !completedEvent.timestamp
                ) {

                    return;

                }


                const matchingStarted =
                    started

                        .filter(
                            startedEvent =>

                                startedEvent.problemId ===
                                completedEvent.problemId &&

                                startedEvent.timestamp
                        )

                        .map(
                            startedEvent => ({
                                ...startedEvent,

                                time:
                                    new Date(
                                        startedEvent.timestamp
                                    ).getTime()

                            })
                        )

                        .filter(
                            startedEvent =>
                                startedEvent.time <=
                                new Date(
                                    completedEvent.timestamp
                                ).getTime()
                        )

                        .sort(
                            (
                                a,
                                b
                            ) =>
                                b.time -
                                a.time
                        );


                if (
                    matchingStarted.length ===
                    0
                ) {

                    return;

                }


                const startTime =
                    matchingStarted[0].time;


                const endTime =
                    new Date(
                        completedEvent.timestamp
                    ).getTime();


                const seconds =
                    (
                        endTime -
                        startTime
                    ) / 1000;


                if (
                    seconds >= 0 &&
                    seconds < 3600
                ) {

                    times.push(
                        seconds
                    );

                }

            }
        );


        return times;

    };


    getBaselineMetrics = () => {

        const baseline =
            this.state.baseline;


        const attempted =
            this.numberOrNull(
                baseline.attempted
            );


        const completed =
            this.numberOrNull(
                baseline.completed
            );


        const masteryBefore =
            this.numberOrNull(
                baseline.masteryBefore
            );


        const masteryAfter =
            this.numberOrNull(
                baseline.masteryAfter
            );


        const hints =
            this.numberOrNull(
                baseline.hints
            );


        const responseTime =
            this.numberOrNull(
                baseline.responseTime
            );


        let completionRate =
            null;


        if (
            attempted !== null &&
            completed !== null
        ) {

            completionRate =
                this.percentage(
                    completed,
                    attempted
                );

        }


        let masteryImprovement =
            null;


        if (
            masteryBefore !== null &&
            masteryAfter !== null
        ) {

            masteryImprovement =
                (
                    masteryAfter -
                    masteryBefore
                ) * 100;

        }


        return {

            attempted,

            completed,

            completionRate,

            masteryBefore,

            masteryAfter,

            masteryImprovement,

            hints,

            averageResponseTime:
                responseTime

        };

    };


    updateBaseline = (
        field,
        value
    ) => {

        this.setState({

            baseline: {

                ...this.state.baseline,

                [field]:
                    value

            }

        });

    };


    saveBaseline = () => {

        try {

            localStorage.setItem(

                BASELINE_KEY,

                JSON.stringify(
                    this.state.baseline
                )

            );


            alert(
                "Baseline evaluation data saved."
            );

        } catch (error) {

            console.error(
                "Unable to save baseline data:",
                error
            );

        }

    };


    clearBaseline = () => {

        const confirmed =
            window.confirm(
                "Clear the baseline evaluation data?"
            );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(
            BASELINE_KEY
        );


        this.setState({

            baseline: {

                attempted: "",
                completed: "",
                masteryBefore: "",
                masteryAfter: "",
                hints: "",
                responseTime: ""

            }

        });

    };


    formatMetric = (
        value,
        suffix = ""
    ) => {

        if (
            value ===
            null ||
            value ===
            undefined ||
            !Number.isFinite(
                Number(value)
            )
        ) {

            return "N/A";

        }


        return (
            Number(value).toFixed(1) +
            suffix
        );

    };


    formatMastery = (
        value
    ) => {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "N/A";

        }


        return (
            value * 100
        ).toFixed(1) + "%";

    };


    formatSeconds = (
        value
    ) => {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "N/A";

        }


        return (
            Number(value).toFixed(2) +
            " s"
        );

    };


    getDifference = (
        baselineValue,
        eduTutorValue
    ) => {

        if (
            baselineValue ===
            null ||
            eduTutorValue ===
            null
        ) {

            return "N/A";

        }


        const difference =
            eduTutorValue -
            baselineValue;


        return (
            difference >= 0
                ? "+"
                : ""
        ) +
        difference.toFixed(1);

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
                        >

                            {title}

                        </Typography>


                        <Typography
                            variant="h4"
                            style={{
                                marginTop: 8
                            }}
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

        const eduTutor =
            this.getEduTutorMetrics();


        const baseline =
            this.getBaselineMetrics();


        return (

            <div
                style={{

                    padding: 24,

                    backgroundColor:
                        "#F6F6F6",

                    minHeight:
                        "100vh"

                }}
            >

                <Paper
                    style={{
                        padding: 24,
                        marginBottom: 24
                    }}
                >

                    <Typography
                        variant="h4"
                        gutterBottom
                    >

                        EduTutor Evaluation

                    </Typography>


                    <Typography
                        variant="body1"
                        color="textSecondary"
                    >

                        Quantitative evaluation of
                        EduTutor against the
                        baseline OATutor system.

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{
                            marginTop: 8
                        }}
                    >

                        EduTutor values are calculated
                        automatically from recorded
                        learner interactions.

                    </Typography>

                </Paper>


                <Grid
                    container
                    spacing={2}
                >

                    {this.renderMetricCard(

                        "EduTutor Problems Attempted",

                        eduTutor.attempted,

                        "Unique problems started"

                    )}

{this.renderMetricCard(

"Answer Accuracy",

eduTutor.accuracy !== null
    ? eduTutor.accuracy.toFixed(1) + "%"
    : "N/A",

eduTutor.answeredCount +
    " answers, " +
    eduTutor.correctAnswers +
    " correct"

)}


                    {this.renderMetricCard(

                        "EduTutor Problems Completed",

                        eduTutor.completed,

                        "Unique problems completed"

                    )}


                    {this.renderMetricCard(

                        "EduTutor Completion Rate",

                        eduTutor.completionRate !==
                        null

                            ?

                            eduTutor.completionRate
                                .toFixed(1) +
                            "%"

                            :

                            "N/A",

                        "Completed / attempted"

                    )}


                    {this.renderMetricCard(

                        "AI Hint Events",

                        eduTutor.hints,

                        "Recorded hint-generation events"

                    )}

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

                        EduTutor Mastery Evaluation

                    </Typography>


                    <Divider
                        style={{
                            marginBottom: 16
                        }}
                    />


                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            item
                            xs={12}
                            md={4}
                        >

                            <Typography
                                color="textSecondary"
                            >

                                Initial recorded mastery

                            </Typography>


                            <Typography
                                variant="h5"
                            >

                                {
                                    this.formatMastery(
                                        eduTutor.masteryBefore
                                    )
                                }

                            </Typography>

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            md={4}
                        >

                            <Typography
                                color="textSecondary"
                            >

                                Final recorded mastery

                            </Typography>


                            <Typography
                                variant="h5"
                            >

                                {
                                    this.formatMastery(
                                        eduTutor.masteryAfter
                                    )
                                }

                            </Typography>

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            md={4}
                        >

                            <Typography
                                color="textSecondary"
                            >

                                Mastery improvement

                            </Typography>


                            <Typography
                                variant="h5"
                            >

                                {
                                    this.formatMetric(
                                        eduTutor.masteryImprovement,
                                        "%"
                                    )
                                }

                            </Typography>

                        </Grid>

                    </Grid>

                </Paper>


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

                        Response Time

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                    >

                        Calculated from problem-started
                        to problem-completed events.

                    </Typography>


                    <Typography
                        variant="h4"
                    >

                        {
                            this.formatSeconds(
                                eduTutor.averageResponseTime
                            )
                        }

                    </Typography>

                </Paper>


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

                        Baseline OATutor Data

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{
                            marginBottom: 16
                        }}
                    >

                        Enter measurements obtained
                        from the same evaluation tasks
                        using the original OATutor
                        baseline.

                    </Typography>


                    <Grid
                        container
                        spacing={2}
                    >

                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Problems Attempted"
                                variant="outlined"
                                value={
                                    this.state.baseline
                                        .attempted
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "attempted",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Problems Completed"
                                variant="outlined"
                                value={
                                    this.state.baseline
                                        .completed
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "completed",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Initial Mastery (0-1)"
                                variant="outlined"
                                inputProps={{
                                    min: 0,
                                    max: 1,
                                    step: 0.01
                                }}
                                value={
                                    this.state.baseline
                                        .masteryBefore
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "masteryBefore",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Final Mastery (0-1)"
                                variant="outlined"
                                inputProps={{
                                    min: 0,
                                    max: 1,
                                    step: 0.01
                                }}
                                value={
                                    this.state.baseline
                                        .masteryAfter
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "masteryAfter",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Hint Events"
                                variant="outlined"
                                value={
                                    this.state.baseline
                                        .hints
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "hints",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>


                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                        >

                            <TextField
                                fullWidth
                                type="number"
                                label="Average Response Time (seconds)"
                                variant="outlined"
                                value={
                                    this.state.baseline
                                        .responseTime
                                }
                                onChange={
                                    event =>
                                        this.updateBaseline(
                                            "responseTime",
                                            event.target.value
                                        )
                                }
                            />

                        </Grid>

                    </Grid>


                    <div
                        style={{
                            marginTop: 16
                        }}
                    >

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={
                                this.saveBaseline
                            }
                        >

                            Save Baseline

                        </Button>


                        <Button
                            variant="outlined"
                            style={{
                                marginLeft: 8
                            }}
                            onClick={
                                this.clearBaseline
                            }
                        >

                            Clear Baseline

                        </Button>

                    </div>

                </Paper>


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

                        Baseline vs EduTutor

                    </Typography>


                    <Divider
                        style={{
                            marginBottom: 16
                        }}
                    />


                    <Table>

                        <TableHead>

                            <TableRow>

                                <TableCell>
                                    Metric
                                </TableCell>

                                <TableCell>
                                    OATutor Baseline
                                </TableCell>

                                <TableCell>
                                    EduTutor
                                </TableCell>

                                <TableCell>
                                    Difference
                                </TableCell>

                            </TableRow>

                        </TableHead>


                        <TableBody>
                        <TableRow>

<TableCell>
    Answer accuracy
</TableCell>

<TableCell>
    N/A
</TableCell>

<TableCell>
    {
        eduTutor.accuracy !== null
            ? eduTutor.accuracy.toFixed(1) + "%"
            : "N/A"
    }
</TableCell>

<TableCell>
    N/A
</TableCell>

</TableRow>

                            <TableRow>

                                <TableCell>
                                    Problems attempted
                                </TableCell>

                                <TableCell>
                                    {
                                        baseline.attempted !==
                                        null

                                            ?

                                            baseline.attempted

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        eduTutor.attempted
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.getDifference(
                                            baseline.attempted,
                                            eduTutor.attempted
                                        )
                                    }
                                </TableCell>

                            </TableRow>


                            <TableRow>

                                <TableCell>
                                    Problems completed
                                </TableCell>

                                <TableCell>
                                    {
                                        baseline.completed !==
                                        null

                                            ?

                                            baseline.completed

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        eduTutor.completed
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.getDifference(
                                            baseline.completed,
                                            eduTutor.completed
                                        )
                                    }
                                </TableCell>

                            </TableRow>


                            <TableRow>

                                <TableCell>
                                    Completion rate
                                </TableCell>

                                <TableCell>
                                    {
                                        baseline.completionRate !==
                                        null

                                            ?

                                            baseline.completionRate
                                                .toFixed(1) +
                                            "%"

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        eduTutor.completionRate !==
                                        null

                                            ?

                                            eduTutor.completionRate
                                                .toFixed(1) +
                                            "%"

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.getDifference(
                                            baseline.completionRate,
                                            eduTutor.completionRate
                                        )
                                    }

                                    {
                                        baseline.completionRate !==
                                        null &&
                                        eduTutor.completionRate !==
                                        null
                                            ? "%"
                                            : ""
                                    }

                                </TableCell>

                            </TableRow>


                            <TableRow>

                                <TableCell>
                                    Mastery improvement
                                </TableCell>

                                <TableCell>
                                    {
                                        this.formatMetric(
                                            baseline.masteryImprovement,
                                            "%"
                                        )
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.formatMetric(
                                            eduTutor.masteryImprovement,
                                            "%"
                                        )
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.getDifference(
                                            baseline.masteryImprovement,
                                            eduTutor.masteryImprovement
                                        )
                                    }

                                    {
                                        baseline.masteryImprovement !==
                                        null &&
                                        eduTutor.masteryImprovement !==
                                        null
                                            ? "%"
                                            : ""
                                    }

                                </TableCell>

                            </TableRow>


                            <TableRow>

                                <TableCell>
                                    AI hint events
                                </TableCell>

                                <TableCell>
                                    {
                                        baseline.hints !==
                                        null

                                            ?

                                            baseline.hints

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        eduTutor.hints
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.getDifference(
                                            baseline.hints,
                                            eduTutor.hints
                                        )
                                    }
                                </TableCell>

                            </TableRow>


                            <TableRow>

                                <TableCell>
                                    Average response time
                                </TableCell>

                                <TableCell>
                                    {
                                        this.formatSeconds(
                                            baseline.averageResponseTime
                                        )
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        this.formatSeconds(
                                            eduTutor.averageResponseTime
                                        )
                                    }
                                </TableCell>

                                <TableCell>
                                    {
                                        baseline.averageResponseTime !==
                                        null &&
                                        eduTutor.averageResponseTime !==
                                        null

                                            ?

                                            (
                                                eduTutor.averageResponseTime -
                                                baseline.averageResponseTime
                                            ).toFixed(2) +
                                            " s"

                                            :

                                            "N/A"
                                    }
                                </TableCell>

                            </TableRow>

                        </TableBody>

                    </Table>

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

                        Evaluation Data Status

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                    >

                        EduTutor data source:

                        {" "}

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

                        Baseline data source:

                        {" "}

                        <strong>
                            {BASELINE_KEY}
                        </strong>

                    </Typography>


                    <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{
                            marginTop: 8
                        }}
                    >

                        Last updated:

                        {" "}

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


export default EvaluationPanel;