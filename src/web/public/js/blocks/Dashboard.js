import ServiceChart from "../components/ServiceChart.js";
import ServiceLog from "../components/ServiceLog.js";
import ServiceTitle from "../components/ServiceTitle.js";
import { DURATION, EVENT } from "../constants.js";
import checkpointService from "../services/checkpoint.js";

export default class Dashboard {
  /**
   * Configuration editor component.
   *
   * @param {Element} $node
   * @param {object} metas
   */
  constructor($node, metas) {
    try {
      this.$node = $node;
      this.$durationButtons = [...$node.querySelectorAll(".js-durationButton")];
      this.$serviceCharts = [...$node.querySelectorAll(".js-serviceChart")];
      this.$serviceLogs = [...$node.querySelectorAll(".js-serviceLog")];
      this.$serviceTitles = [...$node.querySelectorAll(".js-serviceTitle")];

      this.duration = DURATION.ONE_DAY;
      /** @type {string[]} */
      this.serviceUris = metas.serviceUris;
      /** @type {number | null} */
      this.timeout = null;

      this.update = this.update.bind(this);
      this.updateDuration = this.updateDuration.bind(this);
      this.updateService = this.updateService.bind(this);

      this.bindEvents();
      this.render();
      this.update();
    } catch (err) {
      console.error(`[web] [public/js/components/Dashboard()] Error: ${err.message}`);
    }
  }

  /**
   * Bind events.
   *
   * @returns {void}
   */
  bindEvents() {
    try {
      this.$durationButtons.forEach($durationButton =>
        $durationButton.addEventListener("click", this.updateDuration),
      );
    } catch (err) {
      console.error(`[web] [public/js/components/Dashboard#bindEvents()] Error: ${err.message}`);
    }
  }

  /**
   * Update duration.
   *
   * @param {MouseEvent} event
   *
   * @returns {void}
   */
  async updateDuration(event) {
    try {
      if (this.timeout !== null) window.clearTimeout(this.timeout);

      const { target: $durationButton } = event;
      const { duration } = $durationButton.dataset;

      this.$durationButtons.map($durationButton => $durationButton.classList.remove("active"));
      $durationButton.classList.add("active");

      this.duration = duration;
      this.update(true);
    } catch (err) {
      console.error(
        `[web] [public/js/components/Dashboard#updateDuration()] Error: ${err.message}`,
      );
    }
  }

  /**
   * Update Dashboard data.
   *
   * @param {boolean=} isForced
   *
   * @returns {Promise<void>}
   */
  async update(isForced = false) {
    try {
      const lastCheckpoint = await checkpointService.latest();
      if (!isForced && lastCheckpoint.date === this.lastCheckpointDate) {
        this.timeout = window.setTimeout(this.update, 1000);

        return;
      }
      this.lastCheckpointDate = lastCheckpoint.date;

      this.serviceUris.forEach(this.updateService);

      this.timeout = window.setTimeout(this.update, 1000);
    } catch (err) {
      console.error(`[web] [public/js/components/Dashboard#update()] Error: ${err.message}`);
    }
  }

  /**
   * Update service data for a specific URI.
   *
   * @param {string} uri
   *
   * @returns {Promise<void>}
   */
  async updateService(uri) {
    try {
      const checkpoints = await checkpointService.index(uri, this.duration);

      const customEvent = new CustomEvent(EVENT.UPDATE_CHECKPOINTS, {
        detail: { checkpoints, duration: this.duration, uri },
      });
      document.dispatchEvent(customEvent);
    } catch (err) {
      console.error(`[web] [public/js/components/Dashboard#updateService()] Error: ${err.message}`);
    }
  }

  /**
   * Render Dashboard.
   *
   * @returns {void}
   */
  render() {
    try {
      this.$serviceCharts.forEach($serviceChart => new ServiceChart($serviceChart));
      this.$serviceLogs.forEach($serviceLog => new ServiceLog($serviceLog));
      this.$serviceTitles.forEach($serviceTitle => new ServiceTitle($serviceTitle));
    } catch (err) {
      console.error(`[web] [public/js/components/Dashboard#render()] Error: ${err.message}`);
    }
  }
}
