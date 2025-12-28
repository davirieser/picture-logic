<script lang="ts">
	const STOPPED_TIMER_STATE = 0,
		STARTED_TIMER_STATE = 1,
		PAUSED_TIMER_STATE = 2;
	type StoppedTimer = { state: typeof STOPPED_TIMER_STATE, elapsed: number };
	type StartedTimer = { state: typeof STARTED_TIMER_STATE, frame?: number, elapsed: number };
	type PausedTimer = { state: typeof PAUSED_TIMER_STATE, elapsed: number };
	type Timer = StoppedTimer | StartedTimer | PausedTimer; 
    
	let timer : Timer = $state({ state: STOPPED_TIMER_STATE, elapsed: 0 });

    interface Props {
        disabled: boolean,
        started: boolean,
        classes?: Record<string, string>,
    }
    let { 
        disabled,
        started = $bindable(false),
        classes = {},
    } : Props = $props();

	export function startTimer() {
        switch (timer.state) {
            case STARTED_TIMER_STATE:
                return;
            case STOPPED_TIMER_STATE:
		        timer = { state: STARTED_TIMER_STATE, elapsed: 0 };
            case PAUSED_TIMER_STATE: 
                timer = { state: STARTED_TIMER_STATE, elapsed: timer.elapsed };	
                let last_time = performance.now();
                timer.frame = requestAnimationFrame(function update(time) {
                    if (timer.state !== STARTED_TIMER_STATE)
                        return;

                    timer.frame = requestAnimationFrame(update);

                    timer.elapsed += time - last_time;
                    last_time = time;
                });
                break;
        }
	}
	export function stopTimer() {
		if (timer.state !== STARTED_TIMER_STATE)
			return;
	
		if (timer.frame)
			cancelAnimationFrame(timer.frame);
		timer = { state: STOPPED_TIMER_STATE, elapsed: timer.elapsed };
	}
	export function pauseTimer() {
		if (timer.state === STARTED_TIMER_STATE && timer.frame)
			cancelAnimationFrame(timer.frame);

		timer = { state: PAUSED_TIMER_STATE, elapsed: timer.elapsed };
	}

    // TODO: Can i do this using $derived?
    $effect(() => { started = timer.state === STARTED_TIMER_STATE; });

	const timerButtonCallback = $derived.by(() => {
        switch (timer.state) {
            case STARTED_TIMER_STATE:
                return pauseTimer;
            default:
                return startTimer;
        }
    });
</script>

<div class={{ 
    border: true, 
    "rounded": true, 
    "inline-flex": true, 
    "items-center": true, 
    "gap-1": true, 
    "p-1": true,
    ...classes
}}>
    <button class={{
            "icon-[solar--stopwatch-pause-bold]": started,
            "icon-[solar--stopwatch-play-bold]": !started,
        }} 
        {disabled}
        onclick={timerButtonCallback} 
        title="Start/Stop/Pause timer"></button>
    <span class={{ 
        "inline-block": true, 
        "text-sm": true 
    }}>
        Elapsed: {timer.elapsed.toFixed(3)}ms
    </span>
</div>
