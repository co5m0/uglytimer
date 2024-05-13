
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.6.7 */

    const file = "src/App.svelte";

    // (261:2) {:else}
    function create_else_block(ctx) {
    	var button, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			button.textContent = "START";
    			attr(button, "class", "svelte-4hxudu");
    			add_location(button, file, 261, 4, 5470);
    			dispose = listen(button, "click", ctx.startTimer);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (259:2) {#if timer.isPlaying}
    function create_if_block(ctx) {
    	var button, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			button.textContent = "PAUSE";
    			attr(button, "class", "svelte-4hxudu");
    			add_location(button, file, 259, 4, 5412);
    			dispose = listen(button, "click", ctx.stopTimer);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div13, div0, h10, t0_value = ctx.min.now.toString().padStart(2, 0), t0, t1, h11, t3, h12, t4_value = ctx.sec.now.toString().padStart(2, 0), t4, t5, div3, div2, div1, t6, div10, div6, h13, t8, div4, t9, h20, t11, div5, t12, h14, t14, div9, h15, t16, div7, t17, h21, t19, div8, t20, h16, t22, t23, button, t25, div11, input, t26, p, t28, div12, t29, a, dispose;

    	function select_block_type(ctx) {
    		if (ctx.timer.isPlaying) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div13 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = ":";
    			t3 = space();
    			h12 = element("h1");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			t6 = space();
    			div10 = element("div");
    			div6 = element("div");
    			h13 = element("h1");
    			h13.textContent = "+";
    			t8 = space();
    			div4 = element("div");
    			t9 = space();
    			h20 = element("h2");
    			h20.textContent = "MINUTES";
    			t11 = space();
    			div5 = element("div");
    			t12 = space();
    			h14 = element("h1");
    			h14.textContent = "-";
    			t14 = space();
    			div9 = element("div");
    			h15 = element("h1");
    			h15.textContent = "+";
    			t16 = space();
    			div7 = element("div");
    			t17 = space();
    			h21 = element("h2");
    			h21.textContent = "SECONDS";
    			t19 = space();
    			div8 = element("div");
    			t20 = space();
    			h16 = element("h1");
    			h16.textContent = "-";
    			t22 = space();
    			if_block.c();
    			t23 = space();
    			button = element("button");
    			button.textContent = "RESET";
    			t25 = space();
    			div11 = element("div");
    			input = element("input");
    			t26 = space();
    			p = element("p");
    			p.textContent = "Check this fancy box if you want an ugly notification";
    			t28 = space();
    			div12 = element("div");
    			t29 = text("c r e a t e d b y\n    ");
    			a = element("a");
    			a.textContent = "C O 5 M O";
    			attr(h10, "class", "crono svelte-4hxudu");
    			add_location(h10, file, 233, 4, 4719);
    			attr(h11, "class", "crono svelte-4hxudu");
    			add_location(h11, file, 234, 4, 4782);
    			attr(h12, "class", "crono svelte-4hxudu");
    			add_location(h12, file, 235, 4, 4811);
    			attr(div0, "class", "row svelte-4hxudu");
    			add_location(div0, file, 232, 2, 4697);
    			set_style(div1, "width", "" + ctx.len + "%");
    			attr(div1, "class", "svelte-4hxudu");
    			add_location(div1, file, 239, 6, 4935);
    			attr(div2, "class", "progressbar svelte-4hxudu");
    			add_location(div2, file, 238, 4, 4903);
    			attr(div3, "class", "row svelte-4hxudu");
    			add_location(div3, file, 237, 2, 4881);
    			attr(h13, "class", "svelte-4hxudu");
    			add_location(h13, file, 244, 6, 5042);
    			attr(div4, "class", "svelte-4hxudu");
    			add_location(div4, file, 245, 6, 5091);
    			attr(h20, "class", "svelte-4hxudu");
    			add_location(h20, file, 246, 6, 5105);
    			attr(div5, "class", "svelte-4hxudu");
    			add_location(div5, file, 247, 6, 5128);
    			attr(h14, "class", "svelte-4hxudu");
    			add_location(h14, file, 248, 6, 5142);
    			attr(div6, "class", " svelte-4hxudu");
    			add_location(div6, file, 243, 4, 5021);
    			attr(h15, "class", "svelte-4hxudu");
    			add_location(h15, file, 251, 6, 5221);
    			attr(div7, "class", "svelte-4hxudu");
    			add_location(div7, file, 252, 6, 5270);
    			attr(h21, "class", "svelte-4hxudu");
    			add_location(h21, file, 253, 6, 5284);
    			attr(div8, "class", "svelte-4hxudu");
    			add_location(div8, file, 254, 6, 5307);
    			attr(h16, "class", "svelte-4hxudu");
    			add_location(h16, file, 255, 6, 5321);
    			attr(div9, "class", " svelte-4hxudu");
    			add_location(div9, file, 250, 4, 5200);
    			attr(div10, "class", "row adjust-time svelte-4hxudu");
    			add_location(div10, file, 242, 2, 4987);
    			attr(button, "class", "svelte-4hxudu");
    			add_location(button, file, 263, 2, 5525);
    			attr(input, "type", "checkbox");
    			attr(input, "class", "svelte-4hxudu");
    			add_location(input, file, 265, 4, 5603);
    			attr(p, "class", "whited svelte-4hxudu");
    			add_location(p, file, 269, 4, 5713);
    			attr(div11, "class", "row dontknow svelte-4hxudu");
    			add_location(div11, file, 264, 2, 5572);
    			attr(a, "href", "https://github.com/co5m0/uglytimer");
    			attr(a, "class", "svelte-4hxudu");
    			add_location(a, file, 274, 4, 5855);
    			attr(div12, "class", "footer whited svelte-4hxudu");
    			add_location(div12, file, 272, 2, 5801);
    			attr(div13, "class", "container-crono svelte-4hxudu");
    			add_location(div13, file, 231, 0, 4665);

    			dispose = [
    				listen(h13, "click", ctx.increaseTimerMinutes),
    				listen(h14, "click", ctx.decreaseTimerMinutes),
    				listen(h15, "click", ctx.increaseTimerSeconds),
    				listen(h16, "click", ctx.decreaseTimerSeconds),
    				listen(button, "click", ctx.resetTimer),
    				listen(input, "change", ctx.input_change_handler),
    				listen(input, "click", ctx.enableNotification)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div13, anchor);
    			append(div13, div0);
    			append(div0, h10);
    			append(h10, t0);
    			append(div0, t1);
    			append(div0, h11);
    			append(div0, t3);
    			append(div0, h12);
    			append(h12, t4);
    			append(div13, t5);
    			append(div13, div3);
    			append(div3, div2);
    			append(div2, div1);
    			append(div13, t6);
    			append(div13, div10);
    			append(div10, div6);
    			append(div6, h13);
    			append(div6, t8);
    			append(div6, div4);
    			append(div6, t9);
    			append(div6, h20);
    			append(div6, t11);
    			append(div6, div5);
    			append(div6, t12);
    			append(div6, h14);
    			append(div10, t14);
    			append(div10, div9);
    			append(div9, h15);
    			append(div9, t16);
    			append(div9, div7);
    			append(div9, t17);
    			append(div9, h21);
    			append(div9, t19);
    			append(div9, div8);
    			append(div9, t20);
    			append(div9, h16);
    			append(div13, t22);
    			if_block.m(div13, null);
    			append(div13, t23);
    			append(div13, button);
    			append(div13, t25);
    			append(div13, div11);
    			append(div11, input);

    			input.checked = ctx.notificationFlag;

    			append(div11, t26);
    			append(div11, p);
    			append(div13, t28);
    			append(div13, div12);
    			append(div12, t29);
    			append(div12, a);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.min) && t0_value !== (t0_value = ctx.min.now.toString().padStart(2, 0))) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.sec) && t4_value !== (t4_value = ctx.sec.now.toString().padStart(2, 0))) {
    				set_data(t4, t4_value);
    			}

    			if (changed.len) {
    				set_style(div1, "width", "" + ctx.len + "%");
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div13, t23);
    				}
    			}

    			if (changed.notificationFlag) input.checked = ctx.notificationFlag;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div13);
    			}

    			if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let timerSecondBar = 0;
      let timerPercentageBar = 0;
      let min = {
        now: 0,
        restart: 0
      };
      let sec = {
        now: 0,
        restart: 0
      };
      const timer = {
        isPlaying: false
      };
      let intervalID;
      const finishEvent = new Event("timeout");
      let len = 100;
      let notificationPermission = "denied";
      let notificationFlag = false;

      function startTimer(event, time) {
        timer.isPlaying = true; $$invalidate('timer', timer);
        setIntervalWrap();
      }

      function setIntervalWrap() {
        intervalID = setInterval(() => {
          if (sec.now > 0 && min.now >= 0) {
            sec.now -= 1; $$invalidate('sec', sec);
            refreshProgressBar();
          }
          if (sec.now == 0 && min.now > 0) {
            min.now -= 1; $$invalidate('min', min);
            sec.now = 59; $$invalidate('sec', sec);
            refreshProgressBar();
          } else if (sec.now <= 0 && min.now <= 0) {
            clearInterval(intervalID);
            document.dispatchEvent(finishEvent);
            setTimeout(() => {
              timer.isPlaying = false; $$invalidate('timer', timer);
              sec.now = sec.restart; $$invalidate('sec', sec);
              min.now = min.restart; $$invalidate('min', min);
              $$invalidate('len', len = 100);
            }, 2000);
          }
        }, 1000);
      }

      function logger(msg) {
        console.log(msg);
        console.log("TIMER " + JSON.stringify(timer));
        console.log("MIN " + JSON.stringify(min));
        console.log("SEC " + JSON.stringify(sec));
        console.log(timerPercentageBar + " " + timerSecondBar);
      }

      function stopTimer() {
        logger("stop timer call");
        timer.isPlaying = false; $$invalidate('timer', timer);
        clearInterval(intervalID);
      }

      function increaseTimerMinutes() {
        if (!timer.isPlaying) {
          min.now += 1; $$invalidate('min', min);
          alignMinutes();
        }
      }
      function decreaseTimerMinutes() {
        if (!timer.isPlaying && min.now > 0) {
          min.now -= 1; $$invalidate('min', min);
          alignMinutes();
        }
      }
      function increaseTimerSeconds() {
        if (!timer.isPlaying && sec.now < 59) {
          sec.now += 1; $$invalidate('sec', sec);
          alignSeconds();
        }
      }
      function decreaseTimerSeconds() {
        if (!timer.isPlaying && sec.now > 0) {
          sec.now -= 1; $$invalidate('sec', sec);
          alignSeconds();
        }
      }

      function resetTimer() {
        min.now = min.restart = 0; $$invalidate('min', min);
        sec.now = sec.restart = 0; $$invalidate('sec', sec);
        stopTimer();
        $$invalidate('len', len = 100);
      }

      function alignSeconds() {
        sec.restart = sec.now; $$invalidate('sec', sec);
      }
      function alignMinutes() {
        min.restart = min.now; $$invalidate('min', min);
      }
      function refreshProgressBar() {
        $$invalidate('len', len -= timerPercentageBar);
        if (len < 0) $$invalidate('len', len = 0);
      }

      function enableNotification() {
        if (notificationPermission === "denied" && !notificationFlag) {
          Notification.requestPermission().then(function(result) {
            notificationPermission = result;
          });
        }
      }

      document.addEventListener("timeout", e => {
        let ofs = 0;
        let backgroundFlash = setInterval(function() {
          document.body.style.background =
            "rgba(" +
            Math.floor(Math.random() * 256) +
            "," +
            Math.floor(Math.random() * 256) +
            "," +
            Math.floor(Math.random() * 256) +
            "," +
            Math.abs(Math.sin(ofs)) +
            ")";
          ofs += 0.05;
        }, 10);
        setTimeout(() => {
          clearInterval(backgroundFlash);
          document.body.style.background = "transparent";
        }, 1900);
        if (notificationPermission === "granted" && notificationFlag) {
          const text = "Hey your time is out !!";
          const img = "https://img.icons8.com/clouds/100/000000/timer.png";
          var notification = new Notification("To do list", {
            body: text,
            icon: img
          });
          setTimeout(notification.close.bind(notification), 10000);
        }
      });

    	function input_change_handler() {
    		notificationFlag = this.checked;
    		$$invalidate('notificationFlag', notificationFlag);
    	}

    	$$self.$$.update = ($$dirty = { min: 1, sec: 1, timerSecondBar: 1 }) => {
    		if ($$dirty.min || $$dirty.sec || $$dirty.timerSecondBar) { {
            $$invalidate('timerSecondBar', timerSecondBar = min.restart * 60 + sec.restart);
            timerPercentageBar = 100 / timerSecondBar;
          } }
    	};

    	return {
    		min,
    		sec,
    		timer,
    		len,
    		notificationFlag,
    		startTimer,
    		stopTimer,
    		increaseTimerMinutes,
    		decreaseTimerMinutes,
    		increaseTimerSeconds,
    		decreaseTimerSeconds,
    		resetTimer,
    		enableNotification,
    		input_change_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
