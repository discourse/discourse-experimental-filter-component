import { action } from "@ember/object";
import { bind } from "discourse-common/utils/decorators";
import discourseDebounce from "discourse-common/lib/debounce";
import { getOwner } from "discourse-common/lib/get-owner";
import { tracked } from "@glimmer/tracking";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "experimental-filter-component",
  initialize() {
    withPluginApi("0.8", (api) => {
      api.modifyClass("controller:navigation/filter", {
        pluginId: "experimental-filter-component",
        @tracked copyIcon: "link",
        @tracked copyClass: "btn-default",
        @tracked newQueryString: "",

        init() {
          this._super(...arguments);
          this.newQueryString = this.discoveryFilter.q;
        },

        get discoveryFilter() {
          return getOwner(this).lookup("controller:discovery/filter");
        },

        buttonGroups: JSON.parse(settings.filter_buttons),

        @bind
        _restoreButton() {
          if (this.isDestroying || this.isDestroyed) {
            return;
          }
          this.copyIcon = "link";
          this.copyClass = "btn-default";
        },

        get isOrderSet() {
          let orderRegex = /order:\S+/g;
          return !!this.newQueryString.match(orderRegex);
        },

        @action
        modifyQuery(button, regexPattern, idToFocus) {
          let regex = new RegExp(regexPattern, "g");
          // adding placeholder to the input
          this.newQueryString = this.newQueryString.match(regex)
            ? this.newQueryString.replace(regex, "").trim()
            : (
                this.newQueryString +
                " " +
                button.input +
                button.placeholder
              ).trim();
          idToFocus && document.getElementById(idToFocus).focus();
          this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
        },

        @action
        manageColonLabels(label, labelRegex) {
          if (this.newQueryString.match(labelRegex)) {
            this.newQueryString = this.newQueryString
              .replace(labelRegex, "")
              .trim();
            this.discoveryFilter.updateTopicsListQueryParams(
              this.newQueryString
            );
          } else {
            this.newQueryString = this.newQueryString
              ? `${this.newQueryString} ${label.input.trim()}${
                  label.placeholder
                }`
              : `${label.input.trim()}${label.placeholder}`;
            document.getElementById("queryStringInput").focus();
          }
        },

        @action
        clickHandler(button) {
          let labelRegex = new RegExp(`\\b${button.input}\\S*`, "g");
          let orderRegex = /order:\S+(-asc)?/g;
          let orderMatch = this.newQueryString.match(orderRegex);
          let orderExists = this.newQueryString.match(orderRegex)?.[0];

          if (
            button.label.endsWith(":") &&
            !button.label.includes("[option]")
          ) {
            this.manageColonLabels(button, labelRegex);
            return;
          }

          if (button.label === "order:[option]-asc") {
            if (!orderExists) {
              // No order, no service!
              return;
            }
            let ascRegex = /-asc/;
            let hasAsc = orderExists && orderMatch[0].match(ascRegex);

            if (orderExists) {
              this.newQueryString = hasAsc
                ? this.newQueryString.replace(ascRegex, "").trim()
                : this.newQueryString.replace(orderRegex, `$&-asc`).trim();
            } else {
              this.newQueryString += ` ${button.input}`;
            }
          } else if (button.label.startsWith("order:")) {
            if (orderExists) {
              this.newQueryString = this.newQueryString
                .replace(orderRegex, "")
                .trim();
            }
            if (button.input !== orderExists) {
              this.newQueryString += ` ${button.input}`;
            }
          } else {
            if (button.label.endsWith(":")) {
              this.modifyQuery(
                button,
                `${button.label}(\\S+)?`,
                "queryStringInput"
              );
            } else {
              this.modifyQuery(button, `\\b${button.label}[^ ]*\\b`);
            }
          }

          this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
          document.getElementById("queryStringInput").focus();
        },

        @action
        isButtonActive(inputValue) {
          let regex;
          if (inputValue.endsWith("-asc")) {
            regex = new RegExp(`order:\\S*-asc`, "g");
          } else {
            regex = inputValue.endsWith(":")
              ? new RegExp(`\\b${inputValue}\\S*`, "g")
              : new RegExp(`\\b${inputValue}\\b`, "g");
          }
          return this.newQueryString.match(regex);
        },

        @action
        clearInput() {
          this.newQueryString = "";
          this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
        },

        @action
        copyQueryString() {
          // hacky way to copy to clipboard
          // that also works in development enviro
          let temp = document.createElement("textarea");
          temp.value = window.location;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);

          this.copyIcon = "check";
          this.copyClass = "btn-default ok";

          discourseDebounce(this._restoreButton, 3000);
        },
      });
    });
  },
};
