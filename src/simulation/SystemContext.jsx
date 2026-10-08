import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SCENARIOS } from "../data/content.js";
import { DECISION_SCENARIOS, evaluateDecisions } from "./decisions.js";
import {
  BASELINE,
  approach,
  derive,
  pulse,
  sameInputs,
  withActions,
  withScenario,
} from "./model.js";

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [inputs, setInputs] = useState(BASELINE);
  const [scenarioId, setScenarioId] = useState(null);
  const [actions, setActions] = useState([]);
  const [skillId, setSkillId] = useState(null);
  const [organId, setOrganId] = useState("kidneys");
  const [running, setRunning] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState("");
  const [sim, setSim] = useState(() => derive(BASELINE));
  const [shocks, setShocks] = useState([]);
  const [choiceMap, setChoiceMap] = useState({});
  const [lastEvent, setLastEvent] = useState(null);

  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? null;
  const decision = useMemo(() => evaluateDecisions(shocks, choiceMap), [shocks, choiceMap]);

  const untouched = useMemo(
    () => derive(withScenario(inputs, scenario?.shock)),
    [inputs, scenario],
  );

  const steady = useMemo(
    () => derive(withActions(withScenario(inputs, scenario?.shock), actions)),
    [inputs, scenario, actions],
  );

  const live = useMemo(
    () => (running ? pulse(sim, tick) : sim),
    [running, sim, tick],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setSim((current) => approach(current, steady, running ? 0.16 : 1, inputs));
    }, 120);
    return () => window.clearInterval(id);
  }, [steady, running, inputs]);

  useEffect(() => {
    if (!running) return undefined;
    let id = 0;
    const arm = () => {
      window.clearInterval(id);
      if (!document.hidden) {
        id = window.setInterval(() => setTick((value) => value + 1), 1400);
      }
    };
    arm();
    document.addEventListener("visibilitychange", arm);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [running]);

  const setReference = (key, value) => {
    setInputs((current) => ({ ...current, [key]: Number(value) }));
  };

  const chooseScenario = (id) => {
    setNotice("");
    setScenarioId((current) => (current === id ? null : id));
  };

  const toggleAction = (id) => {
    setActions((current) => {
      if (current.includes(id)) {
        setNotice("");
        return current.filter((item) => item !== id);
      }
      if (current.length >= 2) {
        setNotice("Two decisions at a time. The earliest one was released.");
        return [...current.slice(1), id];
      }
      setNotice("");
      return [...current, id];
    });
  };

  const reset = () => {
    setInputs(BASELINE);
    setScenarioId(null);
    setActions([]);
    setNotice("");
    setShocks([]);
    setChoiceMap({});
    setLastEvent(null);
  };

  const openStress = (id) => {
    const scenarioItem = DECISION_SCENARIOS.find((item) => item.id === id);
    if (!scenarioItem) return;
    setOrganId(scenarioItem.organ);
    setShocks((current) => (current.includes(id) ? current : [...current, id]));
    setLastEvent({
      id: `${id}-shock-${Date.now()}`,
      chain: [scenarioItem.organ, "brain"],
      steps: [scenarioItem.problem, "The brain receives the warning"],
      because: scenarioItem.problem,
      title: scenarioItem.title,
    });
  };

  const commitChoice = (scenarioId, choiceId) => {
    const scenarioItem = DECISION_SCENARIOS.find((item) => item.id === scenarioId);
    const choice = scenarioItem?.choices.find((item) => item.id === choiceId);
    if (!scenarioItem || !choice) return;
    setShocks((current) => (current.includes(scenarioId) ? current : [...current, scenarioId]));
    setChoiceMap((current) => ({ ...current, [scenarioId]: choiceId }));
    setOrganId(scenarioItem.organ);
    setLastEvent({
      id: `${choice.id}-${Date.now()}`,
      chain: choice.chain,
      steps: choice.steps,
      because: choice.because,
      title: choice.title,
    });
  };

  const value = {
    inputs,
    isReference: sameInputs(inputs, BASELINE),
    scenario,
    actions,
    skillId,
    setSkillId,
    organId,
    setOrganId,
    running,
    setRunning,
    steady,
    sim,
    untouched,
    live,
    notice,
    setReference,
    chooseScenario,
    toggleAction,
    reset,
    shocks,
    choiceMap,
    decision,
    lastEvent,
    openStress,
    commitChoice,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error("useSystem must be used within SystemProvider");
  return context;
}
