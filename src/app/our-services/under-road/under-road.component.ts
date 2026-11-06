import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-under-road',
    templateUrl: './under-road.component.html',
    styleUrls: ['./under-road.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UnderRoadComponent implements OnInit {
 constructor(private title: Title){}
  ngOnInit(): void {
    this.title.setTitle("Бурильна компанія - прокол під дорогою")
  }

}
