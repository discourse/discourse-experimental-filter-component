import { action } from "@ember/object";
import Component from "@glimmer/component";
import { bind } from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { getOwner } from "discourse-common/lib/get-owner";
import { tracked } from "@glimmer/tracking";

export default class Sidebar extends Component {
  get buttonGroups() {
    return JSON.parse(settings.filter_buttons);
  }

  get discoveryFilter() {
    return getOwner(this).lookup("controller:discovery/filter");
  }

  @action
  manageColonLabels(label, labelRegex) {
    if (this.args.newQueryString.match(labelRegex)) {
      this.newQueryString = this.args.newQueryString
        .replace(labelRegex, "")
        .trim();
      this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
    } else {
      this.newQueryString = this.args.newQueryString
        ? `${this.args.newQueryString} ${label.input.trim()}${
            label.placeholder
          }`
        : `${label.input.trim()}${label.placeholder}`;

      this.args.updateQueryString(this.newQueryString);
      document.getElementById("queryStringInput").focus();
    }
  }

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
    return this.args.newQueryString.match(regex);
  }

  @action
  modifyQuery(button, regexPattern, idToFocus) {
    let regex = new RegExp(regexPattern, "g");
    // adding placeholder to the input
    this.newQueryString = this.args.newQueryString.match(regex)
      ? this.args.newQueryString.replace(regex, "").trim()
      : (
          this.args.newQueryString +
          " " +
          button.input +
          button.placeholder
        ).trim();
    this.args.updateQueryString(this.newQueryString);
    idToFocus && document.getElementById(idToFocus).focus();
    this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
  }

  @action
  clickHandler(button) {
    let labelRegex = new RegExp(`\\b${button.input}\\S*`, "g");
    let orderRegex = /order:\S+(-asc)?/g;
    let orderMatch = this.args.newQueryString.match(orderRegex);
    let orderExists = this.args.newQueryString.match(orderRegex)?.[0];

    if (button.label.endsWith(":") && !button.label.includes("[option]")) {
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
          ? this.args.newQueryString.replace(ascRegex, "").trim()
          : this.args.newQueryString.replace(orderRegex, `$&-asc`).trim();
      } else {
        this.newQueryString += ` ${button.input}`;
      }
    } else if (button.label.startsWith("order:")) {
      if (orderExists) {
        this.newQueryString = this.args.newQueryString
          .replace(orderRegex, "")
          .trim();
      }
      if (button.input !== orderExists) {
        this.newQueryString += ` ${button.input}`;
      }
    } else {
      if (button.label.endsWith(":")) {
        this.modifyQuery(button, `${button.label}(\\S+)?`, "queryStringInput");
      } else {
        this.modifyQuery(button, `\\b${button.label}[^ ]*\\b`);
      }
    }

    this.discoveryFilter.updateTopicsListQueryParams(this.newQueryString);
    document.getElementById("queryStringInput").focus();
  }
}
