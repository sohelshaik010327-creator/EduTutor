import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import HintTextbox from "./HintTextbox.js";
import SubHintSystem from "./SubHintSystem.js";
import Spacer from "../Spacer";
import ErrorBoundary from "../ErrorBoundary";
import withTranslation from "../../util/withTranslation";
import ReloadIcon from "./ReloadIcon";

import {
    renderText,
    chooseVariables,
} from "../../platform-logic/renderText.js";

import { ThemeContext } from "../../config/config";
import { stagingProp } from "../../util/addStagingProperty";

class HintSystem extends React.Component {
    static contextType = ThemeContext;

    constructor(props) {
        super(props);

        const subHintsFinished = [];

        for (let i = 0; i < props.hints.length; i++) {
            const subHints = props.hints[i].subHints || [];

            subHintsFinished.push(
                new Array(subHints.length).fill(0)
            );
        }

        this.giveStuFeedback =
            props.giveStuFeedback;

        this.unlockFirstHint =
            props.unlockFirstHint;

        this.isIncorrect =
            props.isIncorrect;

        this.giveHintOnIncorrect =
            props.giveHintOnIncorrect;

        this.generateHintFromGPT =
            props.generateHintFromGPT;

        this.state = {
            latestStep: 0,

            currentExpanded:
                props.unlockFirstHint ||
                props.isIncorrect
                    ? 0
                    : -1,

            hintAnswer: "",

            showSubHints: new Array(
                props.hints.length
            ).fill(false),

            subHintsFinished:
                subHintsFinished,
        };
    }

    componentDidUpdate(prevProps) {
        /*
         * When the AI hint is added or the hint list changes,
         * keep the local HintSystem state synchronized.
         */
        if (
            prevProps.hints.length !==
            this.props.hints.length
        ) {
            this.setState({
                showSubHints: new Array(
                    this.props.hints.length
                ).fill(false),

                subHintsFinished:
                    this.props.hints.map(
                        (hint) => {
                            const subHints =
                                hint.subHints || [];

                            return new Array(
                                subHints.length
                            ).fill(0);
                        }
                    ),
            });
        }
    }

    /*
     * Expand/collapse a hint.
     */
    unlockHint = (
        event,
        expanded,
        hintIndex
    ) => {
        const hint =
            this.props.hints[hintIndex];

        if (!hint) {
            return;
        }

        /*
         * AI hints are independent from
         * OATutor's normal dependency system.
         */
        if (
            hint.type === "gptHint"
        ) {
            this.setState({
                currentExpanded:
                    expanded
                        ? hintIndex
                        : -1,
            });

            return;
        }

        if (expanded) {
            this.setState({
                currentExpanded:
                    hintIndex,

                latestStep:
                    hintIndex,
            });

            if (
                this.props.hintStatus &&
                this.props.hintStatus[
                    hintIndex
                ] !== 1
            ) {
                this.props.unlockHint(
                    hintIndex,
                    hint.type
                );
            }
        } else {
            this.setState({
                currentExpanded: -1,
            });
        }
    };

    /*
     * Determine whether a normal hint is locked.
     *
     * AI hints are NEVER locked.
     */
    isLocked = (hintIndex) => {
        const hint =
            this.props.hints[hintIndex];

        if (!hint) {
            return true;
        }

        if (
            hint.type === "gptHint"
        ) {
            return false;
        }

        if (hintIndex === 0) {
            return false;
        }

        const dependencies =
            hint.dependencies || [];

        if (
            dependencies.length === 0
        ) {
            return false;
        }

        return !dependencies.every(
            (dependency) =>
                this.props.hintStatus &&
                this.props.hintStatus[
                    dependency
                ] === 1
        );
    };

    /*
     * Show/hide sub-hints.
     */
    toggleSubHints = (
        event,
        hintIndex
    ) => {
        this.setState(
            (prevState) => {
                const showSubHints = [
                    ...prevState.showSubHints,
                ];

                showSubHints[hintIndex] =
                    !showSubHints[hintIndex];

                return {
                    showSubHints,
                };
            }
        );
    };

    /*
     * Unlock a sub-hint.
     */
    unlockSubHint = (
        hintNum,
        hintIndex,
        isScaffold
    ) => {
        this.setState(
            (prevState) => {
                const subHintsFinished =
                    prevState.subHintsFinished.map(
                        (item) => [
                            ...item,
                        ]
                    );

                if (
                    !subHintsFinished[
                        hintIndex
                    ]
                ) {
                    subHintsFinished[
                        hintIndex
                    ] = [];
                }

                subHintsFinished[
                    hintIndex
                ][hintNum] =
                    isScaffold
                        ? 0.5
                        : 1;

                return {
                    subHintsFinished,
                };
            }
        );
    };

    /*
     * Submit a sub-hint answer.
     */
    submitSubHint = (
        parsed,
        hint,
        isCorrect,
        hintIndex,
        hintNum
    ) => {
        if (isCorrect) {
            this.setState(
                (prevState) => {
                    const subHintsFinished =
                        prevState.subHintsFinished.map(
                            (item) => [
                                ...item,
                            ]
                        );

                    if (
                        !subHintsFinished[
                            hintIndex
                        ]
                    ) {
                        subHintsFinished[
                            hintIndex
                        ] = [];
                    }

                    subHintsFinished[
                        hintIndex
                    ][hintNum] = 1;

                    return {
                        subHintsFinished,
                    };
                }
            );
        }

        this.context.firebase.hintLog(
            parsed,
            this.props.problemID,
            this.props.step,
            hint,
            isCorrect,
            this.state.subHintsFinished,

            chooseVariables(
                Object.assign(
                    {},
                    this.props.stepVars,
                    hint.variabilization ||
                        {}
                ),
                this.props.seed
            ),

            this.props.lesson,
            this.props.courseName
        );
    };

    /*
     * Render hint text through the existing
     * OATutor rendering pipeline.
     */
    renderHintText = (hint) => {
        return renderText(
            hint.text || "",

            this.props.problemID,

            chooseVariables(
                Object.assign(
                    {},
                    this.props.stepVars,
                    hint.variabilization ||
                        {}
                ),
                this.props.seed
            ),

            this.context
        );
    };

    render() {
        const {
            translate,
            classes,
            hints,
            problemID,
            seed,
            stepVars,
            index,
        } = this.props;

        const {
            currentExpanded,
            showSubHints,
        } = this.state;

        const {
            debug,
            use_expanded_view,
        } = this.context;

        return (
            <div
                className={
                    classes.root
                }
            >
                {hints.map(
                    (hint, i) => {
                        const isAIHint =
                            hint.type ===
                            "gptHint";

                        /*
                         * AI hint is always available.
                         * Normal hints use dependencies.
                         */
                        const locked =
                            !isAIHint &&
                            this.isLocked(i) &&
                            !(
                                debug &&
                                use_expanded_view
                            );

                        return (
                            <Accordion
                                key={
                                    `${problemID}-${hint.id}-${i}`
                                }

                                expanded={
                                    currentExpanded ===
                                        i ||
                                    (
                                        debug &&
                                        use_expanded_view
                                    )
                                }

                                disabled={
                                    locked
                                }

                                onChange={
                                    (
                                        event,
                                        expanded
                                    ) =>
                                        this.unlockHint(
                                            event,
                                            expanded,
                                            i
                                        )
                                }
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <ExpandMoreIcon />
                                    }

                                    aria-controls={
                                        `hint-panel-${i}`
                                    }

                                    id={
                                        `hint-header-${i}`
                                    }

                                    {...stagingProp({
                                        "data-selenium-target":
                                            `hint-expand-${i}-${index}`,
                                    })}
                                >
                                    <Typography
                                        className={
                                            classes.heading
                                        }
                                    >
                                        {isAIHint
                                            ? "AI Hint: "
                                            : `${translate(
                                                "hintsystem.hint"
                                            )} ${i + 1}: `}

                                        {renderText(
                                            hint.title ===
                                                "nan"
                                                ? ""
                                                : hint.title ||
                                                  "",

                                            problemID,

                                            chooseVariables(
                                                Object.assign(
                                                    {},
                                                    stepVars,
                                                    hint.variabilization ||
                                                        {}
                                                ),
                                                seed
                                            ),

                                            this.context
                                        )}
                                    </Typography>
                                </AccordionSummary>

                                <AccordionDetails>
                                    <div
                                        style={{
                                            width:
                                                "100%",
                                        }}
                                    >
                                        <Typography
                                            component="div"
                                            style={{
                                                width:
                                                    "100%",
                                            }}
                                        >
                                            <div>
                                                {
                                                    this.renderHintText(
                                                        hint
                                                    )
                                                }
                                            </div>

                                            {hint.type ===
                                                "scaffold" && (
                                                <React.Fragment>
                                                    <Spacer />

                                                    <HintTextbox
                                                        hintNum={
                                                            i
                                                        }

                                                        hint={
                                                            hint
                                                        }

                                                        index={
                                                            index
                                                        }

                                                        submitHint={
                                                            this
                                                                .props
                                                                .submitHint
                                                        }

                                                        seed={
                                                            seed
                                                        }

                                                        hintVars={Object.assign(
                                                            {},
                                                            stepVars,
                                                            hint.variabilization ||
                                                                {}
                                                        )}

                                                        toggleHints={
                                                            (
                                                                event
                                                            ) =>
                                                                this.toggleSubHints(
                                                                    event,
                                                                    i
                                                                )
                                                        }

                                                        giveStuFeedback={
                                                            this
                                                                .giveStuFeedback
                                                        }
                                                    />
                                                </React.Fragment>
                                            )}

                                            {(
                                                showSubHints[
                                                    i
                                                ] ||
                                                (
                                                    debug &&
                                                    use_expanded_view
                                                )
                                            ) &&
                                                hint.subHints &&
                                                hint.subHints
                                                    .length >
                                                    0 && (
                                                    <div
                                                        className="SubHints"
                                                    >
                                                        <Spacer />

                                                        <ErrorBoundary
                                                            componentName={
                                                                "SubHintSystem"
                                                            }

                                                            descriptor={
                                                                "subhint"
                                                            }
                                                        >
                                                            <SubHintSystem
                                                                giveStuFeedback={
                                                                    this
                                                                        .giveStuFeedback
                                                                }

                                                                unlockFirstHint={
                                                                    this
                                                                        .unlockFirstHint
                                                                }

                                                                problemID={
                                                                    problemID
                                                                }

                                                                hints={
                                                                    hint.subHints
                                                                }

                                                                unlockHint={
                                                                    this
                                                                        .unlockSubHint
                                                                }

                                                                hintStatus={
                                                                    this
                                                                        .state
                                                                        .subHintsFinished[
                                                                        i
                                                                    ] ||
                                                                    []
                                                                }

                                                                submitHint={
                                                                    this
                                                                        .submitSubHint
                                                                }

                                                                parent={
                                                                    i
                                                                }

                                                                index={
                                                                    index
                                                                }

                                                                seed={
                                                                    seed
                                                                }

                                                                hintVars={Object.assign(
                                                                    {},
                                                                    stepVars,
                                                                    hint.variabilization ||
                                                                        {}
                                                                )}
                                                            />
                                                        </ErrorBoundary>

                                                        <Spacer />
                                                    </div>
                                                )}

                                            {isAIHint &&
                                                !this
                                                    .props
                                                    .isGeneratingHint && (
                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",

                                                            justifyContent:
                                                                "flex-end",

                                                            marginTop:
                                                                "8px",
                                                        }}
                                                    >
                                                        <ReloadIcon
                                                            style={{
                                                                cursor:
                                                                    "pointer",

                                                                fontSize:
                                                                    "24px",
                                                            }}

                                                            onClick={() =>
                                                                this.generateHintFromGPT(
                                                                    true
                                                                )
                                                            }

                                                            title="Regenerate Hint"
                                                        />
                                                    </div>
                                                )}
                                        </Typography>
                                    </div>
                                </AccordionDetails>
                            </Accordion>
                        );
                    }
                )}
            </div>
        );
    }
}

const styles = (theme) => ({
    root: {
        width: "100%",
    },

    heading: {
        fontSize:
            theme.typography.pxToRem(
                15
            ),

        fontWeight:
            theme.typography
                .fontWeightRegular,
    },
});

export default withStyles(styles)(
    withTranslation(HintSystem)
);