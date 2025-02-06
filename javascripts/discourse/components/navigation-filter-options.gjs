import Component from "@glimmer/component";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { and, eq, not } from "truth-helpers";
import DButton from "discourse/components/d-button";
import { getOwner } from "discourse/lib/get-owner";

export default class NavigationFilterOptions extends Component {
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

  <template>
    <div class="topic-query-filter__button-group-container">
      {{#each this.buttonGroups as |group|}}
        <div class="topic-query-filter__button-group">
          <div
            class="topic-query-filter__button-group-header"
          >{{group.label}}</div>
          {{#each group.buttons as |b|}}
            <DButton
              {{on "click" (fn this.clickHandler b)}}
              @translatedLabel={{b.label}}
              @disabled={{if
                (and (eq b.label "order:[option]-asc") (not this.isOrderSet))
                "disabled"
              }}
              class={{if (this.isButtonActive b.input) "btn-primary"}}
            />
          {{/each}}
          {{#each group.subgroups as |subgroup|}}
            <div class="topic-query-filter__button-subgroup">
              {{#each subgroup.buttons as |b|}}
                <DButton
                  {{on "click" (fn this.clickHandler b)}}
                  @translatedLabel={{b.label}}
                  @disabled={{if
                    (and
                      (eq b.label "order:[option]-asc") (not this.isOrderSet)
                    )
                    "disabled"
                  }}
                  class={{if (this.isButtonActive b.input) "btn-primary"}}
                />
              {{/each}}
            </div>
          {{/each}}
        </div>
      {{/each}}
    </div>
  </template>
}
