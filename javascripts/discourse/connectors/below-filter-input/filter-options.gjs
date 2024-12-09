import NavigationFilterOptions from "../../components/navigation-filter-options";

const FilterOptions = <template>
  <NavigationFilterOptions
    @updateQueryString={{@outletArgs.updateQueryString}}
    @newQueryString={{@outletArgs.newQueryString}}
  />
</template>;

export default FilterOptions;
