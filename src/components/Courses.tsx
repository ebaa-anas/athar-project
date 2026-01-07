import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Clock, BookOpen, Award, Play, CheckCircle } from 'lucide-react';

const enrolledCourses = [
  {
    id: 1,
    title: 'Volunteer Leadership Training',
    description: 'Develop essential leadership skills for effective volunteer coordination.',
    instructor: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    progress: 65,
    completedLessons: 13,
    totalLessons: 20,
    duration: '8 hours',
    category: 'Leadership',
    nextLesson: 'Module 4: Team Building Strategies'
  },
  {
    id: 2,
    title: 'Community Engagement Fundamentals',
    description: 'Learn best practices for engaging with and supporting local communities.',
    instructor: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    progress: 30,
    completedLessons: 6,
    totalLessons: 20,
    duration: '10 hours',
    category: 'Community',
    nextLesson: 'Module 2: Building Trust'
  }
];

const availableCourses = [
  {
    id: 3,
    title: 'Environmental Conservation Basics',
    description: 'Understanding key principles of environmental protection and sustainability.',
    instructor: 'Dr. Emily Green',
    image: 'https://images.unsplash.com/photo-1624858194621-92e3efffe22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    lessons: 15,
    duration: '6 hours',
    category: 'Environment',
    students: 234,
    rating: 4.8
  },
  {
    id: 4,
    title: 'Nonprofit Management Essentials',
    description: 'Core concepts and strategies for effective nonprofit organization management.',
    instructor: 'James Wilson',
    image: 'https://images.unsplash.com/photo-1518818608552-195ed130cdf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    lessons: 18,
    duration: '9 hours',
    category: 'Management',
    students: 189,
    rating: 4.9
  },
  {
    id: 5,
    title: 'Youth Mentorship Skills',
    description: 'Techniques and approaches for mentoring young people effectively.',
    instructor: 'Amanda Rodriguez',
    image: 'https://images.unsplash.com/photo-1648254333845-54e0ecba1123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    lessons: 12,
    duration: '5 hours',
    category: 'Education',
    students: 156,
    rating: 4.7
  },
  {
    id: 6,
    title: 'Crisis Response and First Aid',
    description: 'Essential skills for responding to emergencies in volunteer settings.',
    instructor: 'Dr. Robert Martinez',
    image: 'https://images.unsplash.com/photo-1758599668125-e154250f24bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    lessons: 10,
    duration: '4 hours',
    category: 'Healthcare',
    students: 312,
    rating: 4.9
  }
];

const completedCourses = [
  {
    id: 1,
    title: 'Introduction to Volunteering',
    completedDate: 'Sept 15, 2025',
    certificate: true
  },
  {
    id: 2,
    title: 'Effective Communication for Volunteers',
    completedDate: 'Aug 22, 2025',
    certificate: true
  }
];

export function Courses() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Courses</h1>
        <p className="text-gray-500 mt-1">Enhance your skills and knowledge as a volunteer</p>
      </div>

      {/* My Learning */}
      <Card>
        <CardHeader>
          <CardTitle>My Learning</CardTitle>
          <CardDescription>Continue where you left off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {enrolledCourses.map((course) => (
            <div key={course.id} className="flex gap-4">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-gray-900">{course.title}</h3>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress: {course.progress}%</span>
                    <span className="text-teal-700">Next: {course.nextLesson}</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <Button className="bg-teal-700 hover:bg-teal-800">
                  <Play className="mr-2 h-4 w-4" />
                  Continue Learning
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Completed Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Courses</CardTitle>
          <CardDescription>Your achievements and certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-500">Completed on {course.completedDate}</p>
                  </div>
                </div>
                {course.certificate && (
                  <Button variant="outline" size="sm">
                    <Award className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Courses */}
      <div>
        <h2 className="text-gray-900 mb-4">Explore Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <Badge variant="outline">{course.category}</Badge>
                </div>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.students} students • ⭐ {course.rating} rating
                  </div>
                </div>
                <Button className="w-full bg-teal-700 hover:bg-teal-800">
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
